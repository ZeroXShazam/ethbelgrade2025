import json
import os
import sys
from pyfiglet import Figlet
import protected_data

# ⚠️ Your Python code will be run in a python v3.8.3 environment

IEXEC_OUT = os.getenv('IEXEC_OUT')

computed_json = {}

try:
    messages = []

    args = sys.argv[1:]
    print(f"Received {len(args)} args")
    if len(args) > 0:
        messages.append(" ".join(args))

    try:
        # The protected data mock created for the purpose of this Hello World journey
        # contains an object with a key "secretText" which is a string
        protected_text = protected_data.getValue('secretText', 'string')
        messages.append(protected_text)
    except Exception as e:
        print('It seems there is an issue with your protected data:', e)

    # Transform input text into an ASCII Art text
    txt = f"Hello, {' '.join(messages) if len(messages) > 0 else 'World'}!"
    ascii_art_text = Figlet().renderText(txt)

    print(ascii_art_text)

    # Get confidential fields
    income = protected_data.getValue('income', 'f64')
    debt = protected_data.getValue('debt', 'f64')
    credit_score = protected_data.getValue('credit_score', 'f64')

    # Compute a simple score (example: debt-to-income ratio + credit score)
    debt_to_income = debt / income
    score = debt_to_income * (700 - credit_score)

    # Assign level based on score
    if score < 100:
        level = "Level A"
    elif score < 200:
        level = "Level B"
    else:
        level = "Level C"

    result = {
        "income": income,
        "debt": debt,
        "credit_score": credit_score,
        "debt_to_income": debt_to_income,
        "score": score,
        "level": level
    }

    # Write result
    with open(IEXEC_OUT + '/result.txt', 'w') as f:
        json.dump(result, f)
    computed_json = {'deterministic-output-path': IEXEC_OUT + '/result.txt'}
except Exception as e:
    print(e)  # Log the error
    computed_json = {'deterministic-output-path': IEXEC_OUT, 'error-message': str(e)}
finally:
    with open(IEXEC_OUT + '/computed.json', 'w') as f:
        json.dump(computed_json, f)
