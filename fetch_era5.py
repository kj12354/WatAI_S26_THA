import xarray as xr
import gcsfs
import json
import gzip
import os
import numpy as np

# Open the zarr store lazily
fs = gcsfs.GCSFileSystem(token="anon")
store = fs.get_mapper("gcp-public-data-arco-era5/ar/1959-2022-6h-1440x721.zarr")
ds = xr.open_zarr(store)

# Select 120-hour window of 2m_temperature
print("Fetching 2m_temperature for 2020-01-15 00:00 to 2020-01-19 18:00...")
t2m = ds["2m_temperature"].sel(time=slice("2020-01-15T00:00", "2020-01-19T18:00"))

# Downsample spatial resolution by factor of 4
t2m = t2m.isel(latitude=slice(None, None, 4), longitude=slice(None, None, 4))

print(f"Shape before compute: {dict(t2m.sizes)}")
print("Downloading data (this may take a minute)...")

# Download the actual data
data = t2m.values  # shape: (20, 181, 360), float32, Kelvin

# Convert Kelvin to Celsius
data_c = data - 273.15

print(f"Shape: {data_c.shape}")
print(f"Min:  {np.nanmin(data_c):.2f} °C")
print(f"Max:  {np.nanmax(data_c):.2f} °C")
print(f"Mean: {np.nanmean(data_c):.2f} °C")

# Build export dict
times = [str(t)[:16] for t in t2m.time.values]
lats = t2m.latitude.values.tolist()
lons = t2m.longitude.values.tolist()

payload = {
    "times": times,
    "lats": lats,
    "lons": lons,
    "t2m": np.round(data_c, 2).tolist(),
}

# Write compressed JSON
out_path = os.path.join(os.path.dirname(__file__), "era5_t2m.json.gz")
with gzip.open(out_path, "wt", encoding="utf-8") as f:
    json.dump(payload, f, separators=(",", ":"))

size_mb = os.path.getsize(out_path) / (1024 * 1024)
print(f"\nWrote {out_path}")
print(f"File size: {size_mb:.2f} MB")
