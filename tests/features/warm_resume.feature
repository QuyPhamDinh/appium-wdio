Feature: Mobile app lifecycle

  @android @ios @warm_resume
  Scenario: Continue using Forms after switching away
    Given the demo app is installed and launched
    And I am on the Forms screen
    And the text input is initially empty
    And the form switch is initially off
    When I enter "Draft before switching" in the text input
    And I turn on the form switch
    And I send the app to the background
    And I activate the demo app
    Then the Forms screen is visible
    And the text input contains "Draft before switching"
    And the form switch is on
    When I turn off the form switch
    Then the form switch is off

  @ios @warm_resume
  Scenario: Continue using Forms after backgrounding the iOS app
    Given I am on the Forms screen
    And I have entered "iOS draft" in the text input
    And the form switch is initially on
    When I send the app to the background
    And I activate the demo app
    Then the Forms screen is visible
    And the text input contains "iOS draft"
    And the form switch is on

  @android @warm_resume @android_app_switcher
  Scenario: Continue using Forms after opening Android Recents
    Given I am on the Forms screen
    And I have entered "Android draft" in the text input
    And the form switch is initially on
    When I open the Android Recents screen
    And I activate the demo app
    Then the Forms screen is visible
    And the text input contains "Android draft"
    And the form switch is on

  @android @process_death
  Scenario: Android process recreation clears temporary Forms state
    Given I am on the Forms screen
    And I have entered "Draft before kill" in the text input
    And the form switch is initially on
    When I send the app to the background
    And I kill the background Android app process
    And I activate the demo app
    And I return to the Forms screen
    Then the text input is empty
    And the form switch is off

  @ios @cold_relaunch
  Scenario: Forms state is cleared after iOS app termination
    Given I am on the Forms screen
    And I have entered "Draft before termination" in the text input
    And the form switch is initially on
    When I terminate the demo app
    And I activate the demo app
    And I return to the Forms screen
    Then the text input is empty
    And the form switch is off
