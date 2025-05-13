def time_difference(start_date: datetime, end_date: datetime) -> int:
    if not start_date or not end_date:
        return 0
    # Calculate the difference in seconds
    delta = end_date - start_date
    return int(delta.total_seconds())  # Returns the duration in seconds