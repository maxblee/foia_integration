import functools
from foia.models import State

def order_states():
    return sorted([
        {"abbr": state.abbr, "name": state.info.name} 
        for state in State.objects.all()
    ], key=functools.cmp_to_key(state_ordering))

def state_ordering(a, b):
    """Order states by abbreviation, but with United States at top"""
    if a["abbr"] == "US":
        return -1
    elif b["abbr"] == "US":
        return 1
    elif a["abbr"] > b["abbr"]:
        return 1
    elif a["abbr"] < b["abbr"]:
        return -1
    return 0