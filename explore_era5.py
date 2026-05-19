import xarray as xr
import gcsfs

# Open the zarr store lazily — no data is downloaded, only metadata
fs = gcsfs.GCSFileSystem(token="anon")
store = fs.get_mapper("gcp-public-data-arco-era5/ar/1959-2022-6h-1440x721.zarr")
ds = xr.open_zarr(store)

# 1. All available variables
print("=" * 60)
print("AVAILABLE VARIABLES")
print("=" * 60)
for var in sorted(ds.data_vars):
    print(f"  {var}")
print(f"\nTotal: {len(ds.data_vars)} variables")

# 2. Dimensions and their sizes
print("\n" + "=" * 60)
print("DIMENSIONS")
print("=" * 60)
for dim, size in ds.sizes.items():
    print(f"  {dim}: {size}")

# 3. Time range and time step
print("\n" + "=" * 60)
print("TIME INFO")
print("=" * 60)
print(f"  Start: {ds.time.values[0]}")
print(f"  End:   {ds.time.values[-1]}")
print(f"  Step:  {ds.time.values[1] - ds.time.values[0]}")

# 4. Lat/lon resolution
print("\n" + "=" * 60)
print("SPATIAL RESOLUTION")
print("=" * 60)
print(f"  Latitude range:  {ds.latitude.values[0]} to {ds.latitude.values[-1]}")
print(f"  Longitude range: {ds.longitude.values[0]} to {ds.longitude.values[-1]}")
print(f"  Lat step: {ds.latitude.values[1] - ds.latitude.values[0]:.4f}°")
print(f"  Lon step: {ds.longitude.values[1] - ds.longitude.values[0]:.4f}°")

# 5. Sample variable metadata — 2 metre temperature (t2m)
print("\n" + "=" * 60)
print("SAMPLE VARIABLE: 2m_temperature (2 metre temperature)")
print("=" * 60)
print(ds["2m_temperature"])
