# class FarmData(BaseModel):
#     temperature: float
#     soil_moisture: float
#     water_level: float
#     time: str

def downsample(data):
    # desired_points = (24 * 60 // 15) * 7
    # N = len(data)
    # D = N // desired_points
    #
    # downsampled_data = []
    #
    # params = [k for k, v in data[0].dict().items() if isinstance(v, (int, float))]
    #
    # for i in range(0, N, D):
    #     # Calculate representative value for each group
    #     group = data[i:i + D]
    #     for param in params:
    #         representative_value = sum([getattr(item, param) for item in group]) / len(group)
    #     downsampled_data.append(representative_value)
    # return downsampled_data
    return data
