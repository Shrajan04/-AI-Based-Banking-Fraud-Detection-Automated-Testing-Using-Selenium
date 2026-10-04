"""
fraud_engine.py - Explainable Fraud Risk Engine (Python version)
=================================================================

This is the Python version of the rule-based fraud engine. The running web
application uses the identical Node.js version in
backend/services/fraudEngine.js (so only one server needs to be started).
This file is included so the fraud logic can be studied, demonstrated and
unit-tested on its own, without the web application.

No external libraries are needed (plain Python 3.8+).

Usage:
    python fraud_engine.py            -> runs the demo scenarios A-E
    python fraud_engine.py --json     -> reads one transaction as JSON from stdin

JSON input example:
    {"amount": 150000, "hour": 10, "recent_transaction_count": 0,
     "has_sent_to_receiver_before": true, "past_amounts": [5000, 4000, 6000],
     "has_previous_suspicious": false}
"""

import json
import sys

# ---- Rule configuration (same values as the Node.js engine) ----
VERY_LARGE_LIMIT, VERY_LARGE_POINTS = 100000, 40
LARGE_LIMIT, LARGE_POINTS = 50000, 20
FREQUENCY_MAX_PREVIOUS, FREQUENCY_POINTS = 3, 30   # 3+ transactions in last 5 minutes
NEW_RECEIVER_POINTS = 10
UNUSUAL_START_HOUR, UNUSUAL_END_HOUR, UNUSUAL_TIME_POINTS = 0, 5, 30
DEVIATION_MULTIPLIER, DEVIATION_MIN_HISTORY, DEVIATION_POINTS = 3, 3, 20
PREVIOUS_SUSPICIOUS_POINTS = 20

REASONS = {
    "VERY_LARGE_AMOUNT": "Very large transaction amount (above Rs. 1,00,000)",
    "LARGE_AMOUNT": "Large transaction amount (above Rs. 50,000)",
    "HIGH_FREQUENCY": "Multiple transactions within a short period (3 or more in last 5 minutes)",
    "NEW_RECEIVER": "First transaction to this receiver",
    "UNUSUAL_TIME": "Unusual transaction time (between 12 AM and 5 AM)",
    "AMOUNT_DEVIATION": "Amount is much higher than the usual spending pattern",
    "PREVIOUS_SUSPICIOUS": "Previous suspicious activity on this account",
}


def get_risk_level(score):
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def get_status(level):
    return {"HIGH": "BLOCKED", "MEDIUM": "SUSPICIOUS"}.get(level, "APPROVED")


def calculate_risk(amount, hour, recent_transaction_count=0, has_sent_to_receiver_before=True,
                   past_amounts=None, has_previous_suspicious=False):
    """Returns a dict with risk_score, risk_level, status and reasons."""
    score = 0
    reasons = []
    past_amounts = past_amounts or []

    # Rule 1: amount anomaly (only the higher tier applies)
    if amount > VERY_LARGE_LIMIT:
        score += VERY_LARGE_POINTS
        reasons.append(REASONS["VERY_LARGE_AMOUNT"])
    elif amount > LARGE_LIMIT:
        score += LARGE_POINTS
        reasons.append(REASONS["LARGE_AMOUNT"])

    # Rule 2: transaction frequency
    if recent_transaction_count >= FREQUENCY_MAX_PREVIOUS:
        score += FREQUENCY_POINTS
        reasons.append(REASONS["HIGH_FREQUENCY"])

    # Rule 3: new receiver
    if not has_sent_to_receiver_before:
        score += NEW_RECEIVER_POINTS
        reasons.append(REASONS["NEW_RECEIVER"])

    # Rule 4: unusual time
    if UNUSUAL_START_HOUR <= hour < UNUSUAL_END_HOUR:
        score += UNUSUAL_TIME_POINTS
        reasons.append(REASONS["UNUSUAL_TIME"])

    # Rule 5: deviation from the user's normal amount
    if len(past_amounts) >= DEVIATION_MIN_HISTORY:
        average = sum(past_amounts) / len(past_amounts)
        if amount > average * DEVIATION_MULTIPLIER:
            score += DEVIATION_POINTS
            reasons.append(REASONS["AMOUNT_DEVIATION"])

    # Rule 6: previous suspicious activity
    if has_previous_suspicious:
        score += PREVIOUS_SUSPICIOUS_POINTS
        reasons.append(REASONS["PREVIOUS_SUSPICIOUS"])

    score = min(score, 100)
    level = get_risk_level(score)
    return {"risk_score": score, "risk_level": level, "status": get_status(level), "reasons": reasons}


# testuser's seeded history (average Rs. 2,250) and richuser's (average Rs. 5,000)
TESTUSER_HISTORY = [1500, 2000, 2500, 3000]
RICHUSER_HISTORY = [5000, 4000, 6000]

DEMO_SCENARIOS = [
    ("A - Normal: Rs.1,000 to known receiver at 10:00",
     dict(amount=1000, hour=10, past_amounts=TESTUSER_HISTORY)),
    ("B - Large: Rs.1,50,000 (richuser) at 10:00",
     dict(amount=150000, hour=10, past_amounts=RICHUSER_HISTORY)),
    ("C - Rapid: 4th transfer within 5 minutes",
     dict(amount=500, hour=10, recent_transaction_count=3, past_amounts=TESTUSER_HISTORY)),
    ("D - Unusual time: Rs.1,000 at 02:30",
     dict(amount=1000, hour=2, past_amounts=TESTUSER_HISTORY)),
    ("E - Multiple factors: Rs.10,000, new receiver, 02:30",
     dict(amount=10000, hour=2, has_sent_to_receiver_before=False, past_amounts=TESTUSER_HISTORY)),
]


def print_result(title, result):
    print("=" * 70)
    print(title)
    print(f"Risk Score : {result['risk_score']}")
    print(f"Risk Level : {result['risk_level']}")
    print(f"Status     : {result['status']}")
    print("Reasons    :")
    for r in result["reasons"] or ["No risk factors found"]:
        print(f"   - {r}")


def main():
    if "--json" in sys.argv:
        data = json.load(sys.stdin)
        print(json.dumps(calculate_risk(**data), indent=2))
        return
    for title, params in DEMO_SCENARIOS:
        print_result(title, calculate_risk(**params))
    print("=" * 70)


if __name__ == "__main__":
    main()
