import urllib.request
import json
import re

url = "https://shminer.miraheze.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&titles=Stargazing&format=json"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
response = urllib.request.urlopen(req)
data = json.loads(response.read().decode("utf-8"))

pages = data["query"]["pages"]
page_id = list(pages.keys())[0]
wikitext = pages[page_id]["revisions"][0]["slots"]["main"]["*"]

star_names = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces", "Ophiuchus", "Orion", "Hercules", "Draco", "Cetus", "Phoenix", "Eridanus"]

floor_data = []
current_vein = None

for line in wikitext.split("\n"):
    vein_match = re.search(r"\[\[File:([^\]]*?)\s+Vein\.png", line)
    if vein_match:
        current_vein = vein_match.group(1).lower().replace(" ", "")
    
    match = re.match(r"^\|\s*(\d+)\s*\|\|(.*)", line)
    if match:
        floor = int(match.group(1))
        content = match.group(2)
        stars_on_floor = []
        for star in star_names:
            if f"{star}.png" in content:
                stars_on_floor.append(star.lower())
        if stars_on_floor and current_vein:
            floor_data.append({"floor": floor, "vein": current_vein, "stars": stars_on_floor})

with open("src/data/starFloors.js", "w") as f:
    f.write("export const starFloors = " + json.dumps(floor_data, indent=2) + ";\n")

print("Parsed", len(floor_data), "floors.")
