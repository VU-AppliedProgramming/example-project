from typing import Dict, Tuple, List

def check_recipe_fields(json_data: Dict) -> Tuple[bool, str]:
    messages: List[str] = [] 
    if 'title' not in json_data:
        messages.append("title is required")
    if 'instructions' not in json_data:
        messages.append("instructions is required")
    if 'ingredients' not in json_data:
        messages.append("ingredients is required")
    
    return (True, messages) if len(messages) == 0 else (False, messages)