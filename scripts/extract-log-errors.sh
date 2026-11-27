#!/usr/bin/env bash
set -euo pipefail

usage() {
    cat <<'EOF'
Usage: ./scripts/extract-log-errors.sh [options] <log-file> [output-file]

Scan a large test/CI log file on macOS and extract only errors, exceptions,
stack traces, and WebdriverIO/Appium test failure summaries into a compact file.

Options:
  --include-debug    Also scan Appium/WebDriver DEBUG polling lines
  --context N        Lines of before-context per error block (default: 2)
  -h, --help         Show this help message

Examples:
  ./scripts/extract-log-errors.sh logs/ios-ci.log
  ./scripts/extract-log-errors.sh ~/Downloads/run-logs.txt errors.txt
EOF
}

INCLUDE_DEBUG=0
BEFORE_CONTEXT=2

while (( $# > 0 )); do
    case "$1" in
        --include-debug)
            INCLUDE_DEBUG=1
            shift
            ;;
        --context)
            if (( $# < 2 )) || ! [[ "$2" =~ ^[0-9]+$ ]]; then
                echo "Error: --context requires a non-negative integer" >&2
                exit 2
            fi
            BEFORE_CONTEXT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        -*)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
        *)
            break
            ;;
    esac
done

if (( $# < 1 || $# > 2 )); then
    usage >&2
    exit 2
fi

INPUT_LOG="$1"
if [[ ! -f "$INPUT_LOG" ]]; then
    echo "Error: Log file not found: $INPUT_LOG" >&2
    exit 1
fi

if (( $# == 2 )); then
    OUTPUT_FILE="$2"
else
    dir_name=$(dirname "$INPUT_LOG")
    base_name=$(basename "$INPUT_LOG")
    stem="${base_name%.*}"
    if [[ "$stem" == "$base_name" ]]; then
        OUTPUT_FILE="$dir_name/${base_name}.errors.log"
    else
        OUTPUT_FILE="$dir_name/${stem}.errors.log"
    fi
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

INCLUDE_DEBUG="$INCLUDE_DEBUG" BEFORE_CONTEXT="$BEFORE_CONTEXT" /usr/bin/perl -e '
use strict;
use warnings;

my ($in_path, $out_path) = @ARGV;
my $include_debug = $ENV{INCLUDE_DEBUG} ? 1 : 0;
my $before_n = int($ENV{BEFORE_CONTEXT} // 2);

open my $in, "<:encoding(UTF-8)", $in_path or die "Cannot open $in_path: $!\n";
open my $out, ">:encoding(UTF-8)", $out_path or die "Cannot open $out_path: $!\n";

my @ring = ();
my $in_error_block = 0;
my $in_spec_reporter = 0;
my $last_printed_line = 0;
my $blocks = 0;

sub is_noisy_debug_line {
    my ($line) = @_;
    return 0 if $include_debug;
    (my $stripped = $line) =~ s/^\d{4}-\d{2}-\d{2}T[\d:.]+Z\s+//;
    return 1 if $stripped =~ /\bDEBUG\b.*\@wdio\/appium-service/;
    return 1 if $stripped =~ /\bDEBUG\b.*\bwebdriver: request failed due to response error:/;
    return 1 if $stripped =~ /^(?:\[\d+-\d+\]\s+)?(?:\d{4}-\d{2}-\d{2}T[\d:.]+Z\s+)?(?:INFO|DEBUG)\s+webdriver:\s+RESULT\s+\{/;
    return 1 if $stripped =~ /^(?:\[\d+-\d+\]\s+)?\s*stacktrace:\s+\x27(?:NoSuchElementError|StaleElementReferenceError)/;
    return 1 if $stripped =~ /^(?:\[\d+-\d+\]\s+)?\s*\x27\s+at\s+/;
    return 1 if $stripped =~ /^\[[0-9a-f]+\]\[(?:XCUITestDriver|AndroidUiautomator2Driver)\@[^\]]+\]\s+Encountered internal error running command:\s+(?:NoSuchElementError|StaleElementReferenceError):/;
    return 0;
}

sub is_error_trigger {
    my ($line) = @_;
    return 0 if is_noisy_debug_line($line);

    return 1 if $line =~ /(?:^|\s)(?:ERROR|FATAL|SEVERE)\b/;
    return 1 if $line =~ /\b(?:Error|TypeError|ReferenceError|RangeError|SyntaxError|AssertionError|WebDriverError|TimeoutError|NoSuchElementError|SessionNotCreatedError|InvalidSessionIdError|StaleElementReferenceError|UnknownError|UnhandledPromiseRejection|Exception):/;
    return 1 if $line =~ /(?:✖|FAILED in |Process completed with exit code [1-9]|##\[error\]|::error::)/;
    return 1 if $line =~ /^\s*\d+\)\s+\S/;
    return 1 if $line =~ /Timeout after \d+ms/;
    return 1 if $line =~ /\b(?:still not (?:displayed|existing|clickable|enabled)|did not become active|exited with code [1-9])\b/i;
    return 1 if $line =~ /\bnpm ERR!\b/;
    return 1 if $line =~ /\b(?:xcodebuild|ld|clang|javac|adb):.*error:/i;
    return 0;
}

sub is_continuation_line {
    my ($line) = @_;
    return 1 if $line =~ /^\s+at\s+/;
    return 1 if $line =~ /^(?:\[\d+-\d+\]\s+)?(?:\[[^\]]+\]\s+)?\s+at\s+/;
    return 1 if $line =~ /^(?:\[\d+-\d+\]\s+)?(?:\[[^\]]+\]\s+)?(?:Error:|Caused by:|Std(?:Out|Err):)/;
    return 1 if $line =~ /^\s+(?:\^|~|\|)/;
    return 0;
}

my $line_no = 0;
while (my $raw = <$in>) {
    $line_no++;
    $raw =~ s/\r\n?/\n/g;
    $raw =~ s/\e\[[0-9;]*[A-Za-z]//g;
    chomp $raw;

    if ($raw =~ /"spec" Reporter:/) {
        $in_spec_reporter = 1;
        $blocks++;
        print $out "\n===== SPEC REPORTER SUMMARY (line $line_no) =====\n";
        print $out "$line_no: $raw\n";
        $last_printed_line = $line_no;
        next;
    }

    if ($in_spec_reporter) {
        print $out "$line_no: $raw\n";
        $last_printed_line = $line_no;
        if ($raw =~ /^Spec Files:/) {
            $in_spec_reporter = 0;
            print $out "\n";
        }
        next;
    }

    if (is_error_trigger($raw)) {
        if (!$in_error_block) {
            $blocks++;
            print $out "\n--- Error block #$blocks (line $line_no) ---\n";
            for my $ctx (@ring) {
                if ($ctx->[0] > $last_printed_line) {
                    print $out "$ctx->[0]: $ctx->[1]\n";
                    $last_printed_line = $ctx->[0];
                }
            }
        }
        if ($line_no > $last_printed_line) {
            print $out "$line_no: $raw\n";
            $last_printed_line = $line_no;
        }
        $in_error_block = 1;
    } elsif ($in_error_block && is_continuation_line($raw)) {
        if ($line_no > $last_printed_line) {
            print $out "$line_no: $raw\n";
            $last_printed_line = $line_no;
        }
    } else {
        $in_error_block = 0;
    }

    if ($before_n > 0) {
        push @ring, [$line_no, $raw];
        shift @ring while @ring > $before_n;
    }
}

close $in;
close $out;

print "Matched blocks: $blocks\n";
' "$INPUT_LOG" "$OUTPUT_FILE"

input_bytes=$(wc -c < "$INPUT_LOG" | tr -d ' ')
output_bytes=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
echo "Input:  $INPUT_LOG (${input_bytes} bytes)"
echo "Output: $OUTPUT_FILE (${output_bytes} bytes)"
