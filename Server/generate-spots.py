import json

def generate_parking_data(start_lat, start_lon, blocks, spots_per_row, rows_per_block):
    # Define constants for offsets
    spot_width = 0.0000311       # Longitude offset for one spot (9 feet)
    row_height = 0.0000622       # Latitude offset for one row (18 feet)
    block_separation = 0.00004495 # Latitude separation between blocks (20 feet)

    parking_data = []
    spot_id = 1

    for block in range(blocks):
        # Compute the block's starting lower-left corner
        block_start_lat = start_lat - (block * (rows_per_block * row_height + block_separation))

        for row in range(rows_per_block):
            # Compute the row's starting lower-left corner
            row_start_lat = block_start_lat + (row * row_height)

            for spot in range(spots_per_row):
                # Compute the spot's coordinates
                lower_left = {"latitude": row_start_lat, "longitude": start_lon + (spot * spot_width)}
                lower_right = {"latitude": row_start_lat, "longitude": start_lon + ((spot + 1) * spot_width)}
                upper_right = {"latitude": row_start_lat + row_height, "longitude": start_lon + ((spot + 1) * spot_width)}
                upper_left = {"latitude": row_start_lat + row_height, "longitude": start_lon + (spot * spot_width)}

                # Add spot data
                parking_data.append({
                    "id": spot_id,
                    "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

                spot_id += 1

    return parking_data

# Example usage
starting_latitude = 36.81409
starting_longitude = -119.74248
number_of_blocks = 11
rows_per_block = 2
spots_per_row = 48

parking_lot_data = generate_parking_data(
    start_lat=starting_latitude,
    start_lon=starting_longitude,
    blocks=number_of_blocks,
    spots_per_row=spots_per_row,
    rows_per_block=rows_per_block
)

json_string = json.dumps(parking_lot_data)
# Save to JSON file
with open("C:\\Users\\lmcal\\Desktop\\Spot-Me\\application\\assets\\parking_lot_data.json", "w") as json_file:
    json.dump(parking_lot_data, json_file, indent=4)

print("Parking lot data generated and saved to parking_lot_data.json")
