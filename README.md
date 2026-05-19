# Weatherloo — ERA5 2m Temperature Visualization

**Live demo: https://wat-ai-s26-tha.vercel.app/**

A 120-hour global temperature visualization built with React, Leaflet, and the ERA5 reanalysis dataset.

---

## Task 1: Variable — 2m Temperature

- **What it is:** The air temperature 2 metres above the Earth's surface — essentially what you'd feel if you stepped outside. It's the standard way meteorologists report "the temperature" for a location.
- **Type:** Single-level (surface) variable. No pressure level dimension — it's always measured at the same fixed height.
- **Abbreviation:** `t2m` (also called `2m_temperature` in this dataset). Units are Kelvin in the raw data; converted to Celsius for display.

I picked this because it's the most immediately intuitive weather variable — you can look at the map and instantly tell where it's hot, cold, and how temperature shifts with the day/night cycle.

---

## Task 2: Visualization

### What it shows

A full-screen interactive world map displaying global 2m temperature as a color heatmap, animating through 20 timesteps (every 6 hours from Jan 15–19, 2020).

### Features

- **Heatmap overlay** — canvas-rendered temperature field on a dark CartoDB basemap. Color scale runs from deep blue (-55C) through white to deep red (45C).
- **Time controls** — play/pause button auto-advances every 500ms; slider to scrub to any timestep.
- **Hover tooltip** — mouse over any point to see exact lat/lon and temperature.
- **Color legend** — fixed in the bottom-right corner.

### How to run locally

```bash
cd viz
npm install
npm run dev
# opens at http://localhost:5173
```

### Design decisions

- **Canvas + ImageOverlay over tiled raster:** The downsampled grid (360x181) is small enough to render as a single `ImageData` per frame. A pre-computed color lookup table (1001 entries) makes the per-pixel loop fast — no chroma-js calls at render time.
- **Longitude remapping:** ERA5 stores longitudes as 0-360. The pixel columns are swapped at render time so the overlay aligns with Leaflet's -180 to 180 coordinate system.
- **Gzipped JSON:** The full 20-frame dataset compresses to 3.1 MB (pako decompresses in-browser), keeping load times fast on Vercel.

---

## Task 3: Dataset Understanding

**1. What is the time step?**

6 hours. The dataset captures a snapshot of the global atmosphere four times per day (00:00, 06:00, 12:00, 18:00).

**2. What timezone/time standard?**

UTC (Coordinated Universal Time). All timestamps in ERA5 are in UTC with no timezone offset.

**3. What do the numbers 1440x721 refer to?**

The spatial grid dimensions — 1440 longitude points and 721 latitude points. At 0.25 degree spacing, 1440 points cover 360 degrees of longitude (360 / 0.25 = 1440) and 721 points cover 180 degrees of latitude from pole to pole inclusive (180 / 0.25 + 1 = 721).

**4. What is zarr?**

Zarr is a chunked, compressed array storage format designed for large N-dimensional datasets. Instead of storing one massive file, it breaks data into chunks that can be read independently — which means you can fetch just the slice you need (e.g., one variable for one week) without downloading the entire multi-terabyte dataset. It works well with cloud storage (like GCS) and tools like xarray.

---

## Project Structure

```
explore_era5.py    # Opens the zarr store, prints metadata (variables, dims, resolution)
fetch_era5.py      # Fetches 120hr slice of t2m, downsamples, exports to gzipped JSON
viz/               # React web app (Vite + Leaflet + canvas overlay)
```

## AI Tools

I used Claude throughout this project — for exploring the ERA5 dataset structure, writing the data fetch/export scripts, building the React visualization, and debugging the heatmap alignment (longitude remapping from 0-360 to -180-180).
