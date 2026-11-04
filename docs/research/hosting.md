# Hosting the NestJS backend and Postgres for under $10/month with long-lived SSE

Research for #5, map #1. Sources read 2026-11-03 to 2026-11-04. Nothing was signed up for or deployed, so all of this comes from documentation and no behaviour was tested.

## Answer

**Host the backend on Fly.io, with one always-on `shared-cpu-1x` Machine and autostop turned off. Keep Postgres on the Supabase Free plan, and send auth email through custom SMTP (Resend Free).**

Expected cost is about **$3.69/month at 512MB or $6.70/month at 1GB**, plus small egress and a sending domain. Those are prices for Fly's lowest-priced regions. Other regions cost more.

Three things change the plan's assumptions:

1. **No verified option gives $0 with no cold starts.** Every free compute tier checked sleeps. Paying for one small always-on instance is what removes cold starts.
2. **Custom SMTP is required, not optional.** Supabase's built-in email only delivers to members of the project's team, at 2 messages per hour. Friends can't sign in without custom SMTP, which conflicts with the map's "no allowlist" decision.
3. **SSE streams need a heartbeat and a reconnect path on any host.** Send a comment line about every 15 seconds. Deploys and instance replacement cut open streams wherever you host.

## Host comparison

Prices are per month. "Always-on" means no cold starts.

| Host and plan | Always-on cost | Stream limit | Cold start | Verdict |
| --- | --- | --- | --- | --- |
| **Fly.io** `shared-cpu-1x` | [$3.69 at 512MB, $6.70 at 1GB, no platform fee](https://docs.fly.io/about/pricing) | No maximum duration found. [`idle_timeout` is configurable](https://docs.fly.io/reference/configuration) | None with autostop off | **Recommended** |
| **Render** Starter | [$7, 512MB, 0.5 CPU](https://render.com/pricing) | [100 minutes per response](https://render.com/articles/sse-vs-websockets-llm-streaming) | None on paid plans | **Fallback** |
| Railway Hobby | [$5 base including $5 usage; $10/GB and $20/vCPU per month](https://docs.railway.com/pricing/plans) | [15 minutes hard cap; closed after 5 minutes with no data](https://docs.railway.com/networking/public-networking/specs-and-limits) | None if Serverless is off | Works, but the cap is close |
| DigitalOcean App Platform | [$5, 1 shared vCPU, 512MiB](https://www.digitalocean.com/pricing/app-platform) | [Limits page](https://docs.digitalocean.com/products/app-platform/details/limits/) gives no streaming limit | Not checked | Viable on price, limit unknown |
| Hetzner Cloud | [CX23 from €5.99, CAX11 from €6.49, excl. VAT](https://www.hetzner.com/cloud/cost-optimized/) | No platform proxy in the path | None | Viable, but you run the server |
| Cloud Run | About $9 at 0.25 vCPU and 0.5GiB (calculated below) | [60 minutes maximum, 5 minutes default](https://docs.cloud.google.com/run/docs/configuring/request-timeout) | Yes, unless a minimum instance is paid for | Too expensive always-on |
| Render Free | $0 | Same as Render | [Spins down after 15 minutes idle; about 1 minute to wake](https://render.com/docs/free) | Rejected |
| Railway Free | [$1 credit](https://docs.railway.com/pricing/free-trial) | Same as Railway | Credit can't cover always-on | Rejected |
| Koyeb Free | $0 | Not checked | [Sleeps after 1 hour idle; cannot be disabled](https://www.koyeb.com/docs/run-and-scale/scale-to-zero) | Rejected |
| Koyeb Pro | [$29 plus compute](https://www.koyeb.com/pricing) | Not checked | Optional | Over budget |

### Why Fly over Render

- **Memory headroom.** NestJS plus Mastra may not fit comfortably in 512MB; I found no measurement either way. On Fly, 1GB is $6.70. On Render's table, the next step above the $7 512MB instance is $25.
- **Supabase connection.** Supabase's direct connection is IPv6 on the Free plan, and [its docs name Fly.io VMs as an example](https://supabase.com/docs/guides/database/connecting-to-postgres) for that connection string. I didn't confirm IPv6 outbound on Render, and the [shared pooler](https://supabase.com/docs/guides/database/connecting-to-postgres) would cover it there.
- **Where Render is better.** Its streaming limit is stated explicitly, while Fly's is an absence of any stated limit. If the smoke test below fails on Fly, switch to Render Starter, which is still within budget.

### Calculations

These are my arithmetic from the linked prices.

- **Railway at 512MB:** memory alone is 0.5 × $10 = $5, so all the included usage is gone before CPU. Each 0.05 vCPU of average use adds $1, for a bill around $6.
- **Railway Free:** $1 buys about 100MB of memory for a month, which can't hold this app always-on.
- **Cloud Run with one always-on instance over 30 days (2,592,000 seconds), [instance-based billing](https://cloud.google.com/run/pricing):**
  - 0.25 vCPU: (648,000 − 240,000 free) × $0.000018 = $7.34
  - 0.5GiB: (1,296,000 − 450,000 free) × $0.000002 = $1.69
  - Total about $9.03. At 1 vCPU the CPU charge alone is about $42.
  - [Sub-1-vCPU instances carry extra requirements](https://docs.cloud.google.com/run/docs/configuring/services/cpu) that I didn't examine.
- **Cloud Run at scale to zero:** could stay near $0, with [180,000 free vCPU-seconds](https://cloud.google.com/run/pricing) (50 hours at 1 vCPU), but that brings back the cold starts #5 rules out.

## Fly.io caveats

- **No free tier in practice.** The [trial](https://docs.fly.io/about/free-trial) is 2 Machine-hours or 7 days, and [a credit card is required](https://docs.fly.io/about/pricing) after that.
- **`fly launch` defaults to scale to zero.** It [writes `auto_stop_machines = "stop"` and `min_machines_running = 0`](https://docs.fly.io/launch/autostop-autostart), so change both. Apps with autostop on restart in [about 2 seconds or more](https://docs.fly.io/launch/autostop-autostart).
- **Region affects the price.** [Machine prices vary by region](https://docs.fly.io/about/pricing), and the figures above are for `iad` and `ewr`. I couldn't extract the regional table, so check the price if you use another region such as [`gru`](https://docs.fly.io/reference/regions). Run in the same region as Supabase.
- **The maximum stream duration is unconfirmed.** I found no documented cap, which doesn't prove there is none.
- **The idle timeout default is not from the docs.** The docs show the [`idle_timeout` option](https://docs.fly.io/reference/configuration), but the 60-second default comes from [older staff forum replies](https://community.fly.io/t/60-second-timeout-for-http-server/1243). A [2023 user report](https://community.fly.io/t/60s-timeout-on-server-sent-events/13152) describes an SSE stream being cut at 60 seconds despite constant data, with no answer. That's why the smoke test below matters.
- **Stalled clients get disconnected.** Fly staff [said in October 2026](https://community.fly.io/t/fly-proxy-resets-a-stalled-http-stream-after-30s-on-edge-and-flycast-hops-http-options-idle-timeout-has-no-effect/28755) that `TCP_USER_TIMEOUT` is fixed at 30 seconds, so a client that stops reading can be dropped. A backgrounded mobile app may do this, though that's my inference. It's another reason clients must be able to resume.
- **Check the Machine count.** From memory, not verified: `fly launch` may create two Machines for availability, which would double the cost. Run `fly scale count 1`.

Suggested `fly.toml` settings, from the [autostop docs](https://docs.fly.io/launch/autostop-autostart) and [configuration reference](https://docs.fly.io/reference/configuration). Note `kill_timeout` is best-effort, and 300 is its maximum:

```toml
kill_timeout = 300

[http_service]
  auto_stop_machines = "off"
  auto_start_machines = false
  min_machines_running = 1
```

**Smoke test before relying on this:** deploy a small Nest endpoint that streams for about 10 minutes with a 15-second heartbeat, and confirm it survives through the public URL. It costs almost nothing and settles the two unconfirmed items above.

## What the app needs on any host

- **Heartbeats.** [Render's SSE guidance](https://render.com/articles/sse-vs-websockets-llm-streaming) is a comment line starting with `:` about every 15 seconds. This also resets idle timers while the model is thinking.
- **Reconnect and resume.** [Render states](https://render.com/articles/how-render-handles-zero-downtime-deploys) that zero-downtime routing covers only the initial handshake for SSE, and active connections break when the old instance ends. Assume the same on Fly, where a [Machine shutdown is a forced stop after `kill_timeout`](https://docs.fly.io/reference/configuration). Teacher turns shouldn't depend on one unbroken connection.
- **Graceful shutdown.** Handle `SIGTERM` in Nest and let in-flight streams finish or close cleanly.

## Supabase Free plan limits

| Limit | Value | Source |
| --- | --- | --- |
| Active projects | 2 | [Pricing](https://supabase.com/pricing) |
| Database size | 500MB | [Pricing](https://supabase.com/pricing) |
| Disk | 2GB fixed; read-only at 95% | [Database size](https://supabase.com/docs/guides/platform/database-size) |
| Monthly active users | 50,000 | [Pricing](https://supabase.com/pricing) |
| Egress | 5GB, plus 5GB cached | [Pricing](https://supabase.com/pricing) |
| Connections (Nano) | 60 direct, 200 pooler clients | [Compute and disk](https://supabase.com/docs/guides/platform/compute-and-disk) |
| Pro plan, if ever needed | $25/month, which alone exceeds the budget | [Pricing](https://supabase.com/pricing) |

### Project pausing

- **Trigger.** Free projects with [low database activity over 7 days](https://supabase.com/docs/guides/platform/free-project-pausing) get paused. There's no exact threshold. The docs say "typically a few user requests to the database each day" is enough, and that real use may still not be.
- **Warning.** The owner gets an email [roughly a week before](https://supabase.com/docs/guides/platform/free-project-pausing) the pause, then a confirmation.
- **Recovery.** Restoring is a [manual step in the dashboard, available for up to 1 year](https://supabase.com/docs/guides/platform/free-project-pausing).
- **Avoiding it.** Only [Pro guarantees no pausing](https://supabase.com/docs/guides/platform/free-project-pausing). An always-on backend can run a small daily database query, which should help but isn't guaranteed. Since the docs don't commit to a threshold, watch for the warning email.

### Email OTP

| Limit | Built-in email | Custom SMTP |
| --- | --- | --- |
| Recipients | [Project team members only](https://supabase.com/docs/guides/auth/auth-smtp); others get `Email address not authorized` | Any address |
| Send rate | [2 per hour](https://supabase.com/docs/guides/auth/rate-limits), which can change without notice | [30 per hour by default, adjustable](https://supabase.com/docs/guides/auth/auth-smtp) |
| Intended for | [Non-production testing, best-effort](https://supabase.com/docs/guides/auth/auth-smtp) | Production |

These apply to both:

- A user can [request a code once every 60 seconds, and it expires after 1 hour](https://supabase.com/docs/guides/auth/auth-email-passwordless) by default.
- `/auth/v1/otp` and `/auth/v1/verify` default to [30 requests per 5 minutes](https://supabase.com/docs/guides/auth/rate-limits).
- Sign-in emails send a magic link by default. To send a six-digit code, [add `{{ .Token }}` to the Magic Link template](https://supabase.com/docs/guides/auth/auth-email-passwordless).

**Suggested sender:** Resend is [one of the providers Supabase lists](https://supabase.com/docs/guides/auth/auth-smtp), and its [Free plan is 3,000 emails/month and 100/day](https://resend.com/docs/knowledge-base/account-quotas-and-limits), plenty for a few users. [SMTP sending needs a verified domain](https://resend.com/docs/send-with-smtp), so budget for a domain if you don't own one; I didn't price this.

Brevo is the alternative, also on Supabase's list, with [300 emails/day free](https://www.brevo.com/pricing/). I couldn't read its sender requirements (the help page returned 403), so I don't know whether it avoids needing a domain.

### Connecting from Fly

Use the [direct connection string](https://supabase.com/docs/guides/database/connecting-to-postgres), which Supabase recommends for persistent backends on IPv6. If IPv6 gives trouble, use the [shared pooler in session mode](https://supabase.com/docs/guides/database/connecting-to-postgres), which is IPv4 and also supports prepared statements. Drizzle and Mastra will each hold a pool, so keep both small against the 60-connection limit.

## Not verified

- Actual stream behaviour on any host. Nothing was deployed.
- A first-party documentation page for Render's 100-minute limit. It appears in Render's own articles, but I didn't find it in the docs.
- Memory use of NestJS plus Mastra, which decides between 512MB and 1GB.
- Fly's price outside `iad` and `ewr`.
- Streaming limits on DigitalOcean App Platform, and Koyeb's proxy limits.
- Hetzner CX23 availability. The plan page showed "not available" next to it, which may depend on location.
- Free-plan backups on Supabase. The pricing page lists daily backups for paid plans, and I didn't confirm the Free wording, so assume none and take your own dumps if the data matters.
- Koyeb's future. [Its site says it is joining Mistral AI](https://www.koyeb.com/pricing), and its docs mention a Starter plan that the pricing page doesn't show.
