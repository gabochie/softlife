# The five signals

A useful career comparison has to survive contact with a real week. These five
signals are not a personality framework. They are a way to compare the
conditions of work.

## 1. Income

We use the median annual wage for the occupation. Median is more honest than
average because a small number of very high earners can pull an average upward.
The 10th and 90th percentiles show the spread.

Income is scored against $150,000:

```
income score = min(100, median pay ÷ 150,000 × 100)
```

The cap is deliberate. More money matters, especially below a living wage, but
the relationship between extra income and a softer life flattens. A $220,000
job that consumes your evenings is not automatically twice as good as a
$110,000 job that does not. You can change the cap if your “enough” number is
higher.

## 2. Schedule control

Schedule control is the ability to shape when, where, and how much you work.
It includes remote and hybrid options, predictable hours, shift control, client
booking, and the ability to protect deep work.

This is an editorial score from 1 to 5:

- **1:** little control; the schedule is set by someone else or by the market.
- **2:** some flexibility, but frequent last-minute changes.
- **3:** a reliable core schedule with limited flexibility.
- **4:** strong control over location or hours in most weeks.
- **5:** you can design the week around your life most of the time.

```
schedule score = schedule control × 20
```

## 3. Energy cost

Energy cost is the recovery cost of the work. A role can be cognitively hard
and still be sustainable if it has boundaries. A role can be physically light
and still be draining if it requires constant emotional performance.

This is an editorial score from 1 to 5, inverted so that higher is softer:

- **1:** high exposure to conflict, crisis, or physical strain.
- **2:** frequent high-intensity contact or unpredictable pressure.
- **3:** a normal mix of focus and people work.
- **4:** mostly sustainable pace with recoverable peaks.
- **5:** work that leaves energy for the rest of your life.

```
energy score = energy × 20
```

## 4. Entry barrier

Entry barrier is the cost of becoming credible: education, licensing, exams,
portfolio, unpaid time, and the risk of starting over. Lower barrier is better
for a first move, but a higher barrier can protect a market.

This is an editorial score from 1 to 5, inverted so that higher is easier:

- **1:** long or expensive credential, residency, or licensing path.
- **2:** substantial study or portfolio plus a long job search.
- **3:** a certificate or portfolio plus 6–18 months of preparation.
- **4:** skills you can demonstrate with a short course or prior experience.
- **5:** can be tested quickly with existing skills.

```
entry score = entry ease × 20
```

## 5. Demand

Demand combines projected growth and annual openings:

```
growth score  = clamp(50 + growth % × 2.5, 0, 100)
openings score = min(100, annual openings ÷ 50,000 × 100)
demand score   = 0.6 × growth score + 0.4 × openings score
```

A 0 percent growth role scores 50 on growth: stable, not collapsing. A role
shrinking by 10 percent scores 25. A role growing by 20 percent scores 100.
Openings are capped at 50,000 so that very large occupations do not dominate
the ranking.

## The Soft Life Score

The composite is:

```
Soft Life Score =
  0.30 × income
+ 0.25 × schedule
+ 0.20 × energy
+ 0.10 × entry
+ 0.15 × demand
```

The weights reflect the promise of this guide. Money is necessary, so it gets
the largest single weight. Schedule and energy are what make work survivable,
so together they get 45 percent. Entry barrier matters, but it is something you
can change with time, so it gets 10 percent. Demand matters, but a national
projection is not a guarantee for your city or your network, so it gets 15
percent.

## What the score cannot do

- It cannot price your specific offer, city, visa status, or care
  responsibilities.
- It cannot tell you whether you will like the work.
- It cannot capture a bad manager, a toxic team, or a great one.
- It cannot compare a full-time employee with a solo business owner fairly.
- It cannot replace a conversation with someone doing the job.

The score is a filter, not a verdict. Use it to narrow 24 roles to 8, then use
interviews, shadowing, and small tests to narrow 8 to 3.

## Make it yours

If your priority is cash flow this year, raise income and demand. If your
priority is care work or health, raise schedule and energy. If you are
rebuilding after burnout, lower the entry barrier and protect schedule before
chasing the highest median.

> **Action:** Copy the formula into your notes and change the weights for your
> situation. Write one sentence explaining each change. That explanation is
> your decision criteria.
