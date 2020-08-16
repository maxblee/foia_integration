import os

from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from dotenv import load_dotenv

def login_google(browser: webdriver.Firefox):
    """Logs in through your Google account (given you're at a given website)"""
    start_url = browser.current_url
    browser.find_element_by_xpath("//*[@href='/accountsgoogle/login/']").click()
    browser.find_element_by_id("identifierId").send_keys(os.environ["TEST_GMAIL_USER"])
    browser.find_element_by_id("identifierId").send_keys(Keys.ENTER)
    password_field = WebDriverWait(browser, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//*[@aria-label='Enter your password']"))
    )
    password_field.send_keys(os.environ["TEST_GMAIL_PASSWORD"])
    password_field.send_keys(Keys.ENTER)
    # if I don't sleep, the browser doesn't store the login credentials
    # (This may change once I create the profile template)
    import time; time.sleep(2)
    browser.get(start_url)