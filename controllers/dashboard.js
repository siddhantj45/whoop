const { whoopGet } = require('../utils/whoopClient')

async function fetchAll(endpoint, params = {}) {
  const records = []
  let nextToken = null
  do {
    const query = { limit: 25, ...params }
    if (nextToken) query.nextToken = nextToken
    const res = await whoopGet(endpoint, query)
    records.push(...(res.records || []))
    nextToken = res.next_token || null
  } while (nextToken)
  return records
}

exports.getData = async (req, res) => {
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000)
  const start = since.toISOString()

  try {
    const [profile, body, recoveries, sleeps, workouts, cycles] = await Promise.all([
      whoopGet('/v2/user/profile/basic').catch(() => null),
      whoopGet('/v2/user/measurement/body').catch(() => null),
      fetchAll('/v2/recovery', { start }),
      fetchAll('/v2/activity/sleep', { start }),
      fetchAll('/v2/activity/workout', { start }),
      fetchAll('/v2/cycle', { start })
    ])

    const latest = recoveries[recoveries.length - 1]

    res.set('Cache-Control', 'no-store')
    res.json({
      profile: profile ? { first_name: profile.first_name, last_name: profile.last_name } : null,
      body,
      latest: latest ? {
        date: latest.created_at,
        score: latest.score?.recovery_score,
        hrv: latest.score?.hrv_rmssd_milli,
        rhr: latest.score?.resting_heart_rate,
        spo2: latest.score?.spo2_percentage
      } : null,
      recoveries: recoveries.map(r => ({
        date: r.created_at,
        score: r.score?.recovery_score,
        hrv: r.score?.hrv_rmssd_milli,
        rhr: r.score?.resting_heart_rate,
        spo2: r.score?.spo2_percentage
      })),
      sleeps: sleeps.filter(s => !s.nap).map(s => {
        const ss = s.score?.stage_summary || {}
        return {
          date: s.start,
          durationHours: (((ss.total_in_bed_time_milli || 0) - (ss.total_awake_time_milli || 0)) / 3600000).toFixed(1),
          performance: s.score?.sleep_performance_percentage,
          efficiency: s.score?.sleep_efficiency_percentage,
          rem: ((ss.total_rem_sleep_time_milli || 0) / 3600000).toFixed(2),
          deepSleep: ((ss.total_slow_wave_sleep_time_milli || 0) / 3600000).toFixed(2),
          light: ((ss.total_light_sleep_time_milli || 0) / 3600000).toFixed(2),
          respiratoryRate: s.score?.respiratory_rate
        }
      }),
      workouts: workouts.map(w => ({
        date: w.start,
        sport: w.sport_name,
        strain: w.score?.strain,
        avgHr: w.score?.average_heart_rate,
        maxHr: w.score?.max_heart_rate,
        kj: w.score?.kilojoule,
        distanceM: w.score?.distance_meter
      })),
      cycles: cycles.map(c => ({
        date: c.start,
        strain: c.score?.strain,
        avgHr: c.score?.average_heart_rate,
        kj: c.score?.kilojoule
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
