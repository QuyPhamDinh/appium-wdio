Feature: Mobile app lifecycle

  @android @ios @warm_resume
  Scenario: Continue using Forms after switching away
    Given the demo app is installed and launched
    And I am on the Forms screen
    And the text input is initially empty
    And the form switch is initially off
    When I enter "Draft before switching" in the text input
    And I turn on the form switch
    And I go to the device Home screen
    And I return to the running demo app
    Then the Forms screen is visible
    And the text input contains "Draft before switching"
    And the form switch is on
    When I turn off the form switch
    Then the form switch is off

  @ios @warm_resume @ios_app_switcher
  Scenario: Continue using Forms after returning with iOS App Switcher
    Given I am on the Forms screen
    And I have entered "iOS draft" in the text input
    And the form switch is initially on
    When I swipe up to open the iOS App Switcher
    And I select the demo app
    Then the Forms screen is visible
    And the text input contains "iOS draft"
    And the form switch is on

  @android @warm_resume @android_app_switcher
  Scenario: Continue using Forms after returning with Android App Switcher
    Given I am on the Forms screen
    And I have entered "Android draft" in the text input
    And the form switch is initially on
    When I open the Android Recents screen
    And I select the demo app
    Then the Forms screen is visible
    And the text input contains "Android draft"
    And the form switch is on

  @android @process_death
  Scenario: Android process recreation clears temporary Forms state
    Given I am on the Forms screen
    And I have entered "Draft before kill" in the text input
    And the form switch is initially on
    When I send the app to the background
    And the Android system kills the app process
    And I reopen the demo app
    And I return to the Forms screen
    Then the text input is empty
    And the form switch is off

  @ios @cold_relaunch
  Scenario: Forms state is cleared after iOS app termination
    Given I am on the Forms screen
    And I have entered "Draft before kill" in the text input
    And the form switch is initially on
    When I terminate the demo app
    And I relaunch the demo app
    And I return to the Forms screen
    Then the text input is empty
    And the form switch is off
