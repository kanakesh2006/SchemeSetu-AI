import sys
import os

# Ensure backend directory is in the import path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.scheme import UserProfile
from services.matcher import is_eligible, explain_mismatch

# Mock schemes for testing
SCHEME_ALL = {
    "scheme_id": "all-open",
    "applicable_states": None,
    "gender": None,
    "caste_categories": None,
    "min_age": None,
    "max_age": None,
    "max_income": None,
    "occupation_types": None,
}

SCHEME_CONSTRAINED = {
    "scheme_id": "constrained-scheme",
    "applicable_states": ["TN", "AP"],
    "gender": "female",
    "caste_categories": ["SC", "ST"],
    "min_age": 18,
    "max_age": 35,
    "max_income": 120000,
    "occupation_types": ["farmer", "student"],
}

def test_eligible_open_scheme():
    user = UserProfile(
        state="TN",
        gender="male",
        caste_category="GEN",
        age=25,
        income_annual=500000,
        occupation_type="salaried"
    )
    assert is_eligible(user, SCHEME_ALL) is True
    assert len(explain_mismatch(user, SCHEME_ALL)) == 0

def test_eligible_matching_constrained():
    user = UserProfile(
        state="TN",
        gender="female",
        caste_category="SC",
        age=20,
        income_annual=80000,
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is True
    assert len(explain_mismatch(user, SCHEME_CONSTRAINED)) == 0

def test_ineligible_state():
    user = UserProfile(
        state="MH",  # Not in TN or AP
        gender="female",
        caste_category="SC",
        age=20,
        income_annual=80000,
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("residents of" in r for r in reasons)

def test_ineligible_gender():
    user = UserProfile(
        state="TN",
        gender="male",  # Not female
        caste_category="SC",
        age=20,
        income_annual=80000,
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("female applicants" in r for r in reasons)

def test_ineligible_age_too_young():
    user = UserProfile(
        state="TN",
        gender="female",
        caste_category="SC",
        age=16,  # Under 18
        income_annual=80000,
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("Minimum age required" in r for r in reasons)

def test_ineligible_age_too_old():
    user = UserProfile(
        state="TN",
        gender="female",
        caste_category="SC",
        age=40,  # Over 35
        income_annual=80000,
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("Maximum age allowed" in r for r in reasons)

def test_ineligible_income():
    user = UserProfile(
        state="TN",
        gender="female",
        caste_category="SC",
        age=20,
        income_annual=150000,  # Over 120,000
        occupation_type="student"
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("annual income allowed" in r for r in reasons)

def test_ineligible_occupation():
    user = UserProfile(
        state="TN",
        gender="female",
        caste_category="SC",
        age=20,
        income_annual=80000,
        occupation_type="salaried"  # Not student or farmer
    )
    assert is_eligible(user, SCHEME_CONSTRAINED) is False
    reasons = explain_mismatch(user, SCHEME_CONSTRAINED)
    assert any("only for" in r for r in reasons)
