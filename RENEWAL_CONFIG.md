# Business Renewal Configuration

## Automatic Renewal Period Calculation

The Business Renewal feature **automatically calculates** the renewal period based on the current year:

- **Before or on January 20**: Renewal period is for the **current year** (January 1-20 of current year)
- **After January 20**: Renewal period is for the **next year** (January 1-20 of next year)

**Example:**
- If today is **January 15, 2026** → Renewal period is **January 1-20, 2026**
- If today is **February 1, 2026** → Renewal period is **January 1-20, 2027**

## Environment Variables (Optional Override)

You can override the automatic calculation by setting these environment variables in your `.env` file:

```env
# Renewal Period Configuration (Optional - only if you want to override automatic calculation)
RENEWAL_PERIOD_START=2026-01-01
RENEWAL_PERIOD_END=2026-01-20
RENEWAL_PENALTY_START_DATE=2026-01-21
RENEWAL_PENALTY_RATE=0.25
```

### Configuration Details

- **RENEWAL_PERIOD_START**: Start date of the renewal period (format: YYYY-MM-DD) - **Optional**
- **RENEWAL_PERIOD_END**: End date of the renewal period (format: YYYY-MM-DD) - **Optional**
- **RENEWAL_PENALTY_START_DATE**: Date when late filing penalties begin (format: YYYY-MM-DD) - **Optional**
- **RENEWAL_PENALTY_RATE**: Penalty rate as a decimal (e.g., 0.25 = 25% penalty) - **Optional**

### Default Behavior (Automatic)

If environment variables are **not set**, the system automatically:
- Calculates renewal period based on current date
- Sets renewal period to January 1-20 of the appropriate year
- Sets penalty start date to January 21 of the same year
- Uses 25% (0.25) as the default penalty rate

### When to Use Manual Configuration

Set environment variables only if you need:
- A renewal period in a different month (not January)
- A renewal period with a different duration (not 20 days)
- A custom penalty rate
- To override the automatic year calculation for testing

### Example Manual Configuration

```env
# Override for a different month (e.g., March)
RENEWAL_PERIOD_START=2026-03-01
RENEWAL_PERIOD_END=2026-03-31
RENEWAL_PENALTY_START_DATE=2026-04-01
RENEWAL_PENALTY_RATE=0.25

# Override for testing with a specific year
RENEWAL_PERIOD_START=2026-01-01
RENEWAL_PERIOD_END=2026-01-20
RENEWAL_PENALTY_START_DATE=2026-01-21
RENEWAL_PENALTY_RATE=0.25
```

## Notes

- **By default, no configuration is needed** - the system automatically calculates the renewal period
- Environment variables are **optional** and only used if you want to override the automatic calculation
- The configuration service is located at: `backend/services/business-service/src/config/renewalConfig.js`
- Changes to environment variables require a backend service restart to take effect
- The automatic calculation updates each year without any manual changes needed
