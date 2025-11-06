# SciPy Interpolation Functions

Advanced interpolation methods equivalent to `scipy.interpolate` functionality for scattered data, splines, and multi-dimensional interpolation.

## Core Interpolation Functions

### SP_INTERP1D - 1D Interpolation

Multi-method 1D interpolation with support for various algorithms.

**Basic Usage:**
```rexx
LET x_points = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET y_points = JSON_PARSE text="[2, 8, 18, 32, 50]"
LET x_new = JSON_PARSE text="[1.5, 2.5, 3.5, 4.5]"

-- Linear interpolation (default)
LET linear_result = SP_INTERP1D x=x_points y=y_points x_new=x_new kind="linear"
-- Returns: [5, 13, 25, 41]
```

**Available Methods:**
```rexx
-- Linear interpolation
LET linear = SP_INTERP1D x=x_points y=y_points x_new=x_new kind="linear"

-- Cubic interpolation  
LET cubic = SP_INTERP1D x=x_points y=y_points x_new=x_new kind="cubic"

-- Nearest neighbor
LET nearest = SP_INTERP1D x=x_points y=y_points x_new=x_new kind="nearest"

-- Quadratic interpolation
LET quadratic = SP_INTERP1D x=x_points y=y_points x_new=x_new kind="quadratic"
```

**Boundary Handling:**
```rexx
LET x_points = JSON_PARSE text="[1, 2, 3, 4]"
LET y_points = JSON_PARSE text="[10, 20, 30, 40]"
LET x_new = JSON_PARSE text="[0.5, 4.5]"  -- Outside original range

-- Extrapolate beyond boundaries
LET extrapolated = SP_INTERP1D x=x_points y=y_points x_new=x_new bounds_error=false fill_value="extrapolate"

-- Use fill values
LET filled = SP_INTERP1D x=x_points y=y_points x_new=x_new bounds_error=false fill_value=0
```

### SP_PCHIP - Shape-Preserving Interpolation

Piecewise Cubic Hermite Interpolating Polynomial that preserves monotonicity.

```rexx
LET x_data = JSON_PARSE text="[0, 1, 2, 3, 4]"
LET y_data = JSON_PARSE text="[0, 1, 8, 27, 64]"  -- Cubic function
LET x_eval = JSON_PARSE text="[0.5, 1.5, 2.5, 3.5]"

LET pchip_result = SP_PCHIP x=x_data y=y_data x_new=x_eval
-- Shape-preserving interpolation that avoids overshooting
```

**Monotonicity Preservation:**
```rexx
-- Monotonic data stays monotonic
LET x_mono = JSON_PARSE text="[1, 2, 3, 4, 5]"
LET y_mono = JSON_PARSE text="[1, 4, 9, 16, 25]"  -- Increasing
LET x_test = JSON_PARSE text="[1.5, 2.5, 3.5, 4.5]"

LET monotonic = SP_PCHIP x=x_mono y=y_mono x_new=x_test preserve_monotonicity=true
```

### SP_INTERP2D - 2D Bilinear Interpolation

Interpolation for gridded 2D data using bilinear methods.

```rexx
-- Define 2D grid
LET x_grid = JSON_PARSE text="[1, 2, 3]"  -- X coordinates
LET y_grid = JSON_PARSE text="[1, 2, 3]"  -- Y coordinates
LET z_values = JSON_PARSE text="[[1, 4, 9], [4, 8, 12], [9, 12, 15]]"  -- Z = x*y

-- Interpolation points
LET x_new = JSON_PARSE text="[1.5, 2.5]"
LET y_new = JSON_PARSE text="[1.5, 2.5]"

LET interp_2d = SP_INTERP2D x=x_grid y=y_grid z=z_values x_new=x_new y_new=y_new
-- Returns interpolated values at (1.5,1.5) and (2.5,2.5)
```

**Grid vs Scattered Data:**
```rexx
-- Regular grid interpolation
LET regular_grid = SP_INTERP2D x="[0, 1, 2]" y="[0, 1, 2]" z="[[0, 1, 4], [1, 2, 5], [4, 5, 8]]" x_new="[0.5, 1.5]" y_new="[0.5, 1.5]"

-- Specify interpolation method
LET bicubic_2d = SP_INTERP2D x="[0, 1, 2]" y="[0, 1, 2]" z="[[0, 1, 4], [1, 2, 5], [4, 5, 8]]" x_new="[0.5]" y_new="[0.5]" kind="cubic"
```

## Spline Functions

### SP_SPLREP - B-spline Representation

Create B-spline representation from data points.

```rexx
LET x_data = JSON_PARSE text="[0, 1, 2, 3, 4, 5]"
LET y_data = JSON_PARSE text="[0, 1, 8, 27, 64, 125]"  -- Cubic data

-- Create B-spline representation
LET spline_rep = SP_SPLREP x=x_data y=y_data degree=3
-- Returns: {knots: [...], coefficients: [...], degree: 3}
```

**Smoothing Factor:**
```rexx
-- Noisy data
LET x_noisy = JSON_PARSE text="[0, 1, 2, 3, 4, 5]"  
LET y_noisy = JSON_PARSE text="[0.1, 1.2, 7.8, 27.3, 63.9, 125.1]"

-- Smooth spline (s > 0 for smoothing)
LET smooth_spline = SP_SPLREP x=x_noisy y=y_noisy s=1.0 degree=3

-- Exact interpolation (s = 0)
LET exact_spline = SP_SPLREP x=x_noisy y=y_noisy s=0 degree=3
```

### SP_SPLEV - B-spline Evaluation

Evaluate B-spline at new points with optional derivatives.

```rexx
LET x_data = JSON_PARSE text="[0, 1, 2, 3, 4]"
LET y_data = JSON_PARSE text="[0, 1, 4, 9, 16]"
LET spline = SP_SPLREP x=x_data y=y_data degree=3

-- Evaluate spline at new points
LET x_eval = JSON_PARSE text="[0.5, 1.5, 2.5, 3.5]"
LET values = SP_SPLEV spline=spline x=x_eval der=0  -- Function values

-- First derivatives
LET derivatives = SP_SPLEV spline=spline x=x_eval der=1

-- Second derivatives
LET second_deriv = SP_SPLEV spline=spline x=x_eval der=2
```

### SP_CUBIC_SPLINE - Natural Cubic Splines

Cubic splines with natural boundary conditions.

```rexx
LET x_points = JSON_PARSE text="[0, 1, 2, 3, 4]"
LET y_points = JSON_PARSE text="[1, 2, 1, 3, 2]"
LET x_new = JSON_PARSE text="[0.5, 1.5, 2.5, 3.5]"

-- Natural cubic spline (second derivatives = 0 at endpoints)
LET natural_spline = SP_CUBIC_SPLINE x=x_points y=y_points x_new=x_new bc_type="natural"

-- Not-a-knot boundary condition
LET nak_spline = SP_CUBIC_SPLINE x=x_points y=y_points x_new=x_new bc_type="not-a-knot"

-- Clamped boundary (specify derivatives at endpoints)
LET clamped_spline = SP_CUBIC_SPLINE x=x_points y=y_points x_new=x_new bc_type="clamped" y_left=1.5 y_right=-0.5
```

## Radial Basis Function Interpolation

### SP_RBF - Radial Basis Functions

Scattered data interpolation using radial basis functions.

```rexx
-- Scattered data points
LET x_coords = JSON_PARSE text="[1, 2, 3, 2.5, 1.5]"
LET y_coords = JSON_PARSE text="[1, 2, 1, 3, 2]"  
LET values = JSON_PARSE text="[5, 8, 3, 12, 7]"

-- Evaluation points
LET x_eval = JSON_PARSE text="[1.5, 2.5]"
LET y_eval = JSON_PARSE text="[1.5, 2.5]"

-- Multiquadric RBF (default)
LET rbf_result = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="multiquadric"
```

**Available RBF Types:**
```rexx
-- Different radial basis functions
LET multiquadric = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="multiquadric"

LET gaussian = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="gaussian"

LET linear = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="linear"

LET cubic = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="cubic"

LET quintic = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="quintic"

LET thin_plate = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval function="thin_plate"
```

**Smoothing Parameter:**
```rexx
-- Exact interpolation (smooth = 0)
LET exact_rbf = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval smooth=0

-- Smoothed approximation
LET smooth_rbf = SP_RBF x=x_coords y=y_coords z=values x_new=x_eval y_new=y_eval smooth=0.1
```

## Advanced Interpolation Methods

### SP_AKIMA1D - Akima Interpolation

Shape-preserving interpolation that avoids overshooting.

```rexx
LET x_data = JSON_PARSE text="[0, 1, 2, 3, 4, 5]"
LET y_data = JSON_PARSE text="[0, 0, 1, 1, 0, 0]"  -- Step-like data
LET x_eval = JSON_PARSE text="[0.5, 1.5, 2.5, 3.5, 4.5]"

-- Akima interpolation avoids overshooting near discontinuities
LET akima_result = SP_AKIMA1D x=x_data y=y_data x_new=x_eval
```

**Comparison with Other Methods:**
```rexx
-- Step function data
LET x_step = JSON_PARSE text="[0, 1, 2, 3, 4]"
LET y_step = JSON_PARSE text="[1, 1, 5, 5, 1]"
LET x_test = JSON_PARSE text="[0.5, 1.5, 2.5, 3.5]"

-- Akima avoids overshooting
LET akima_smooth = SP_AKIMA1D x=x_step y=y_step x_new=x_test

-- Cubic spline may overshoot  
LET cubic_overshoot = SP_INTERP1D x=x_step y=y_step x_new=x_test kind="cubic"

-- PCHIP is also shape-preserving
LET pchip_preserve = SP_PCHIP x=x_step y=y_step x_new=x_test
```

### SP_BARYCENTRIC - Barycentric Lagrange Interpolation

Barycentric form of Lagrange interpolation with dynamic point addition.

```rexx
LET x_points = JSON_PARSE text="[0, 1, 2, 3]"
LET y_points = JSON_PARSE text="[1, 2, 5, 10]"
LET x_eval = JSON_PARSE text="[0.5, 1.5, 2.5]"

-- Create barycentric interpolator
LET barycentric = SP_BARYCENTRIC x=x_points y=y_points x_new=x_eval

-- Add new points dynamically (if supported)
LET updated_bary = SP_BARYCENTRIC x="[0, 1, 2, 3, 4]" y="[1, 2, 5, 10, 17]" x_new=x_eval
```

### SP_KROGH - Krogh Interpolation

Krogh interpolation using divided differences.

```rexx
LET x_data = JSON_PARSE text="[0, 1, 3, 4]"
LET y_data = JSON_PARSE text="[0, 1, 9, 16]"
LET x_new = JSON_PARSE text="[0.5, 2, 3.5]"

-- Krogh interpolation with derivatives
LET krogh_values = SP_KROGH x=x_data y=y_data x_new=x_new der=0

-- First derivatives at evaluation points
LET krogh_deriv = SP_KROGH x=x_data y=y_data x_new=x_new der=1
```

## Scattered Data Interpolation

### SP_GRIDDATA - Grid from Scattered Data

Convert scattered data to regular grid using various methods.

```rexx
-- Scattered input points
LET points_x = JSON_PARSE text="[0, 1, 0.5, 1.5, 0.25, 1.25, 0.75]"
LET points_y = JSON_PARSE text="[0, 0, 0.5, 0.5, 1, 1, 0.25]"
LET values = JSON_PARSE text="[1, 4, 2.5, 6, 2, 5, 3]"

-- Regular grid coordinates
LET grid_x = JSON_PARSE text="[0, 0.5, 1, 1.5]"
LET grid_y = JSON_PARSE text="[0, 0.25, 0.5, 0.75, 1]"

-- Linear interpolation to grid
LET gridded_linear = SP_GRIDDATA points_x=points_x points_y=points_y values=values grid_x=grid_x grid_y=grid_y method="linear"

-- Nearest neighbor
LET gridded_nearest = SP_GRIDDATA points_x=points_x points_y=points_y values=values grid_x=grid_x grid_y=grid_y method="nearest"

-- Cubic interpolation
LET gridded_cubic = SP_GRIDDATA points_x=points_x points_y=points_y values=values grid_x=grid_x grid_y=grid_y method="cubic"
```

### SP_REGULARGRID - Fast N-D Grid Interpolation

Optimized interpolation for regular N-dimensional grids.

```rexx
-- 2D regular grid
LET x_coords = JSON_PARSE text="[0, 1, 2]"
LET y_coords = JSON_PARSE text="[0, 1, 2, 3]" 
LET grid_values = JSON_PARSE text="[[1, 2, 3], [2, 4, 6], [3, 6, 9], [4, 8, 12]]"

-- Interpolation points
LET xi = JSON_PARSE text="[0.5, 1.5]"
LET yi = JSON_PARSE text="[0.5, 2.5]"

-- Fast regular grid interpolation
LET regular_result = SP_REGULARGRID x=x_coords y=y_coords values=grid_values xi=xi yi=yi method="linear"
```

**3D Grid Example:**
```rexx
-- 3D regular grid  
LET x_grid = JSON_PARSE text="[0, 1]"
LET y_grid = JSON_PARSE text="[0, 1]"
LET z_grid = JSON_PARSE text="[0, 1]"
LET values_3d = JSON_PARSE text="[[[0, 1], [1, 2]], [[1, 2], [2, 3]]]"  -- 2x2x2 grid

LET xi_3d = JSON_PARSE text="[0.5]"
LET yi_3d = JSON_PARSE text="[0.5]"  
LET zi_3d = JSON_PARSE text="[0.5]"

LET result_3d = SP_REGULARGRID x=x_grid y=y_grid z=z_grid values=values_3d xi=xi_3d yi=yi_3d zi=zi_3d method="linear"
```

## Specialized Spline Functions

### SP_UNISPLINE - Smoothing Splines

Univariate spline with smoothing factor and optional weights.

```rexx
-- Noisy data
LET x_noisy = JSON_PARSE text="[0, 0.5, 1, 1.5, 2, 2.5, 3]"
LET y_noisy = JSON_PARSE text="[0.1, 0.4, 1.1, 2.3, 3.9, 6.2, 9.1]"

-- Smoothing spline (s controls smoothing)
LET smooth_uni = SP_UNISPLINE x=x_noisy y=y_noisy s=0.5 x_new="[0.25, 0.75, 1.25, 1.75, 2.25, 2.75]"

-- Weighted smoothing (emphasize certain points)
LET weights = JSON_PARSE text="[1, 2, 1, 2, 1, 2, 1]"
LET weighted_smooth = SP_UNISPLINE x=x_noisy y=y_noisy weights=weights s=0.3 x_new="[0.25, 0.75, 1.25]"
```

### SP_LSQ_SPLINE - Least Squares Splines

Least-squares spline with user-specified knots.

```rexx
LET x_data = JSON_PARSE text="[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]"
LET y_data = JSON_PARSE text="[0, 0.25, 1, 2.25, 4, 6.25, 9, 12.25, 16]"

-- Specify internal knots  
LET knots = JSON_PARSE text="[1, 2, 3]"
LET x_eval = JSON_PARSE text="[0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75]"

-- Least-squares spline with specified knots
LET lsq_spline = SP_LSQ_SPLINE x=x_data y=y_data knots=knots degree=3 x_new=x_eval
```

### SP_SPLPREP - Parametric Spline Preparation

Prepare parametric splines for N-dimensional curves.

```rexx
-- 2D parametric curve (spiral)
LET x_curve = JSON_PARSE text="[0, 1, 2, 3, 4, 5]"
LET y_curve = JSON_PARSE text="[0, 1, 0, -1, 0, 1]"

-- Prepare parametric spline
LET param_spline = SP_SPLPREP x=x_curve y=y_curve s=0 degree=3
-- Returns parametric representation

-- Evaluate parametric spline
LET t_values = JSON_PARSE text="[0, 0.2, 0.4, 0.6, 0.8, 1.0]"
LET curve_points = SP_SPLEV spline=param_spline x=t_values
-- Returns x,y coordinates along curve
```

## Practical Examples

### Surface Interpolation from Scattered Data
```rexx
-- Scattered 3D surface data
LET x_scatter = JSON_PARSE text="[0, 1, 2, 0.5, 1.5, 1, 0, 2]"
LET y_scatter = JSON_PARSE text="[0, 0, 0, 1, 1, 2, 2, 2]"  
LET z_scatter = JSON_PARSE text="[1, 2, 5, 3, 6, 8, 4, 12]"

-- Create regular evaluation grid
LET x_regular = JSON_PARSE text="[0, 0.5, 1, 1.5, 2]"
LET y_regular = JSON_PARSE text="[0, 0.5, 1, 1.5, 2]"

-- Interpolate scattered data to regular grid
LET surface_rbf = SP_RBF x=x_scatter y=y_scatter z=z_scatter x_new=x_regular y_new=y_regular function="thin_plate"

-- Alternative using griddata  
LET surface_grid = SP_GRIDDATA points_x=x_scatter points_y=y_scatter values=z_scatter grid_x=x_regular grid_y=y_regular method="cubic"

SAY "RBF Surface: " || JSON_STRINGIFY(data=surface_rbf)
SAY "Griddata Surface: " || JSON_STRINGIFY(data=surface_grid)
```

### Time Series Interpolation and Smoothing
```rexx
-- Time series with missing values
LET times = JSON_PARSE text="[0, 1, 3, 4, 6, 8, 10]"  -- Missing t=2,5,7,9
LET values = JSON_PARSE text="[10, 12, 18, 20, 28, 35, 45]"

-- Fill missing time points
LET complete_times = JSON_PARSE text="[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"

-- Shape-preserving interpolation
LET filled_pchip = SP_PCHIP x=times y=values x_new=complete_times

-- Smooth interpolation
LET filled_smooth = SP_UNISPLINE x=times y=values s=2.0 x_new=complete_times

-- Exact cubic spline
LET filled_cubic = SP_CUBIC_SPLINE x=times y=values x_new=complete_times bc_type="natural"

SAY "PCHIP filled: " || JSON_STRINGIFY(data=filled_pchip)
SAY "Smooth filled: " || JSON_STRINGIFY(data=filled_smooth) 
SAY "Cubic filled: " || JSON_STRINGIFY(data=filled_cubic)
```

### Multi-Method Comparison
```rexx
-- Test data with sharp transitions
LET x_test = JSON_PARSE text="[0, 1, 2, 2.1, 2.2, 3, 4]"
LET y_test = JSON_PARSE text="[0, 0, 0, 5, 10, 10, 10]"  -- Sharp step
LET x_eval = JSON_PARSE text="[0.5, 1.5, 2.05, 2.15, 2.5, 3.5]"

-- Compare interpolation methods
LET linear_interp = SP_INTERP1D x=x_test y=y_test x_new=x_eval kind="linear"
LET cubic_interp = SP_INTERP1D x=x_test y=y_test x_new=x_eval kind="cubic"
LET pchip_interp = SP_PCHIP x=x_test y=y_test x_new=x_eval
LET akima_interp = SP_AKIMA1D x=x_test y=y_test x_new=x_eval

SAY "Linear: " || JSON_STRINGIFY(data=linear_interp)
SAY "Cubic: " || JSON_STRINGIFY(data=cubic_interp)  
SAY "PCHIP: " || JSON_STRINGIFY(data=pchip_interp)
SAY "Akima: " || JSON_STRINGIFY(data=akima_interp)
```

SciPy interpolation functions provide sophisticated tools for data interpolation, smoothing, and approximation, supporting both regular grids and scattered data with various accuracy and smoothness trade-offs.