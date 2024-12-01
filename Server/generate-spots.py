import json

def generate_parking_data(start_lat, start_lon, blocks, spots_per_row):
    # Define constants for offsets
    spot_width = 0.0000311       # Longitude offset for one spot (9 feet)
    row_height = 0.0000622       # Latitude offset for one row (18 feet)
    block_separation = 0.00004495 # Latitude separation between blocks (~13 feet)

    parking_data = []
    spot_id = 1

    # Vertical blocks facing east (4th block, handicap)            
    extra1_start_lat = 36.814207
    extra1_start_lon = -119.74260
    final_spots_per_row = 5
    block = 1
    parkingLotID = "P6"
    
    extra_spots_width = 0.0000227 # latitude offset
    extra_spots_height = 0.0000622 # longitude offset
    for spot in range(final_spots_per_row):
        # Compute the spot's coordinates
            lower_left = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon}
            lower_right = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_right = {"latitude": extra1_start_lat  -((spot + 1) * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_left = {"latitude": extra1_start_lat - ((spot + 1) * extra_spots_width), "longitude": extra1_start_lon}

            # Add spot data
            parking_data.append({
                "parkingLot": parkingLotID,
                "block": block,
                "id": spot_id,
                "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

            spot_id += 1
    
    # Horizontal blocks facing norht (Northmost)            
    extra1_start_lat = 36.814255
    extra1_start_lon = -119.742505
    final_spots_per_row = 17
    parkingLotID = "P6"
    block += 1

    for spot in range(final_spots_per_row):
            # Compute the spot's coordinates
            lower_left = {"latitude": extra1_start_lat, "longitude": extra1_start_lon + (spot * spot_width)}
            lower_right = {"latitude": extra1_start_lat, "longitude": extra1_start_lon + ((spot + 1) * spot_width)}
            upper_right = {"latitude": extra1_start_lat + row_height, "longitude": extra1_start_lon + ((spot + 1) * spot_width)}
            upper_left = {"latitude": extra1_start_lat + row_height, "longitude": extra1_start_lon + (spot * spot_width)}

            # Add spot data
            parking_data.append({
                "parkingLot": parkingLotID,
                "block": block,
                "id": spot_id,
                "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
            })

            spot_id += 1

    # Vertical blocks facing east (1st block)            
    extra1_start_lat = 36.8142663
    extra1_start_lon = -119.7409249
    final_spots_per_row = 32
    parkingLotID = "P6"
    block += 1
    
    extra_spots_width = 0.0000247 # latitude offset
    extra_spots_height = 0.0000622 # longitude offset
    for spot in range(final_spots_per_row):
        # Compute the spot's coordinates
            lower_left = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon}
            lower_right = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_right = {"latitude": extra1_start_lat  -((spot + 1) * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_left = {"latitude": extra1_start_lat - ((spot + 1) * extra_spots_width), "longitude": extra1_start_lon}

            # Add spot data
            parking_data.append({
                "parkingLot": parkingLotID,
                "block": block,
                "id": spot_id,
                "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

            spot_id += 1

    # Vertical blocks facing east (2nd block)            
    extra1_start_lat = 36.8132664
    extra1_start_lon = -119.7409249
    final_spots_per_row = 45
    parkingLotID = "P6"
    block += 1
    
    extra_spots_width = 0.0000227 # latitude offset
    extra_spots_height = 0.0000622 # longitude offset
    for spot in range(final_spots_per_row):
        # Compute the spot's coordinates
            lower_left = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon}
            lower_right = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_right = {"latitude": extra1_start_lat  -((spot + 1) * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_left = {"latitude": extra1_start_lat - ((spot + 1) * extra_spots_width), "longitude": extra1_start_lon}

            # Add spot data
            parking_data.append({
                "parkingLot": parkingLotID,
                "block": block,
                "id": spot_id,
                "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

            spot_id += 1

    # Horizontal spots facing north
    for block in range(blocks):
        # Determine the number of rows and spots per block based on the block index (According to Fresno State map && Google Earth)
        if block < 11: 
            parkingLotID = "P6"
            rows_per_block = 2
            block_start_lat = start_lat - (block * (rows_per_block * row_height + block_separation))
        elif block in [11, 12, 19]: # This blocks have 1 row only
            rows_per_block = 1
            if block == 11 or block == 12:
                parkingLotID = "P6"
                block_start_lat = start_lat - (block * (2* rows_per_block * row_height + block_separation)) +row_height
            else:
                parkingLotID = "P5"
                block_start_lat = start_lat - (block * (2* rows_per_block * row_height + block_separation))+2*row_height

        else: # Regular blocks have 2 rows
            parkingLotID = "P5"
            rows_per_block = 2
            block_start_lat = start_lat - (block * (rows_per_block * row_height + block_separation)) + row_height
            if block == 16:
                spots_per_row = 47
                start_lon = start_lon + ((48-47)*spot_width)
            elif block == 17:
                spots_per_row = 43
                start_lon = start_lon + ((47-43)*spot_width)
            elif block == 18:
                spots_per_row = 39
                start_lon = start_lon + ((43-39)*spot_width)
            elif block == 19:
                spots_per_row = 38
                start_lon = start_lon + ((40-38)*spot_width)

        for row in range(rows_per_block):
            # Compute the row's starting lower-left corner
            row_start_lat = block_start_lat + (row * row_height)
            if (block in [16, 17]) and row == 0: # This blocks have a deleted spot on the lower left corner
                final_spots_per_row = spots_per_row - 1 # Reduce number of spots by 1 due to shifting
                adj_lon = start_lon + spot_width  # Shift spots to the left
            else:
                adj_lon = start_lon
                final_spots_per_row = spots_per_row

            for spot in range(final_spots_per_row):
                # Compute the spot's coordinates
                lower_left = {"latitude": row_start_lat, "longitude": adj_lon + (spot * spot_width)}
                lower_right = {"latitude": row_start_lat, "longitude": adj_lon + ((spot + 1) * spot_width)}
                upper_right = {"latitude": row_start_lat + row_height, "longitude": adj_lon + ((spot + 1) * spot_width)}
                upper_left = {"latitude": row_start_lat + row_height, "longitude": adj_lon + (spot * spot_width)}

                # Add spot data
                parking_data.append({
                    "parkingLot": parkingLotID,
                    "block": block,
                    "id": spot_id,
                    "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

                spot_id += 1

    # Vertical blocks facing east (3rd block)  
    parkingLotID = "P5"          
    extra1_start_lat = 36.8119623
    extra1_start_lon = -119.74093
    final_spots_per_row = 39
    block += 1
    
    extra_spots_width = 0.0000227 # latitude offset
    extra_spots_height = 0.0000622 # longitude offset
    for spot in range(final_spots_per_row):
        # Compute the spot's coordinates
            lower_left = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon}
            lower_right = {"latitude": extra1_start_lat - (spot * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_right = {"latitude": extra1_start_lat  -((spot + 1) * extra_spots_width), "longitude": extra1_start_lon + extra_spots_height}
            upper_left = {"latitude": extra1_start_lat - ((spot + 1) * extra_spots_width), "longitude": extra1_start_lon}

            # Add spot data
            parking_data.append({
                "parkingLot": parkingLotID,
                "block": block,
                "id": spot_id,
                "coordinates": [lower_left, lower_right, upper_right, upper_left, lower_left],
                })

            spot_id += 1

    return parking_data


# Example usage
starting_latitude = 36.81409
starting_longitude = -119.74248
number_of_blocks = 20
default_spots_per_row = 48
#extra_blocks = 1

parking_lot_data = generate_parking_data(
    start_lat=starting_latitude,
    start_lon=starting_longitude,
    blocks=number_of_blocks,
    spots_per_row=default_spots_per_row,
    #extra = extra_blocks,
)

json_string = json.dumps(parking_lot_data)
# Save to JSON file
with open("C:\\Users\\lmcal\\Desktop\\Spot-Me\\application\\assets\\parking_lot_data.json", "w") as json_file:
    json.dump(parking_lot_data, json_file, indent=4)

print("Parking lot data generated and saved to parking_lot_data.json")
