# OpenAI models and Lesson cost for Teach Me

Research for [#4](https://github.com/gabifs/teach-me/issues/4). Docs read on 2026-11-03. OpenAI changes models and prices often, so recheck the [pricing page][pricing] before relying on these numbers.

## Answer

| Job | Recommended model | Reasoning effort | Fallback |
| --- | --- | --- | --- |
| Teacher conversation | `gpt-6.1-terra` | `low` | `gpt-6-luna` to cut cost |
| Lesson writing | `gpt-6.1-terra` | `medium` | `gpt-6.1-sol` if Lessons read thin |
| Summarizing | `gpt-6-luna` | `low` | none needed |

- **Cost per Lesson (estimate):** about **$0.15** typical, from $0.08 to $0.53 across the scenarios below. Using `gpt-6-luna` for everything costs about $0.03 typical.
- **Cost per hosted web search (estimate):** about **$0.02** on Terra and about $0.01 on Luna. The $0.01 fee is published; the rest is an assumed amount of search content.
- **New key:** a learner should plan to buy **$5 of credit**, which reaches the Build tier. No tier above Build is needed. The docs do not show that a key with no credit purchase can use these models.

The model choices are based on how OpenAI describes each model. No Teach Me prompts were run against them, so judge the Terra and Luna difference on real Lessons.

## Why these models

All three are current, support the hosted `web_search` tool and structured outputs, and have a 1,050,000 token context window. All three support `low` and `medium` reasoning effort, and `medium` is the default ([Terra][terra], [Luna][luna], [Sol][sol]).

| Model | Input / 1M | Cached input / 1M | 30-minute cache write / 1M | Output / 1M | OpenAI's positioning |
| --- | ---: | ---: | ---: | ---: | --- |
| `gpt-6-luna` | $0.10 | $0.01 | $0.125 | $0.50 | ["Focused, high-volume tasks"][luna] |
| `gpt-6.1-terra` | $1.00 | $0.05 | $1.25 | $5.00 | ["Clear, natural writing"; "draft and revise text"][terra] |
| `gpt-6.1-sol` | $2.00 | $0.10 | $2.50 | $10.00 | ["Complex coding, computer use, and professional work"][sol] |
| `gpt-6-astra` | $10.00 | $1.00 | $12.50 | $50.00 | ["Most demanding work"][models] |

Prices are Standard tier for prompts up to 272K input tokens, from the [pricing page][pricing]. Above 272K, input and cache rates double and output rates rise 1.5x for the whole request ([Luna][luna]). The context loop should never get close to that.

- **Teacher and Lesson writing:** Terra's stated strength is writing, and that is most of what both jobs do. It was released on [2026-10-26][changelog], so it has little track record. OpenAI suggests [comparing Terra with Sol on the same inputs][selection], judging audience fit, voice and useful detail as well as accuracy.
- **Summarizing:** this is a focused, repeated job, which matches [Luna's positioning][selection]. It costs a tenth of Terra.
- **Astra:** ruled out for now. It costs ten times Terra for input and output, and nothing in the map calls for it.
- **Older models:** skip them. `gpt-4o-mini`, `gpt-4.1` and `gpt-4.1-mini` snapshots are [due to be removed on 2027-01-14][deprecations], with `gpt-6-luna` as the named replacement.

## Hosted web search cost

- **Fee:** [$10.00 per 1,000 calls][pricing], so $0.01 per call, on all models for the `web_search` tool.
- **Search content tokens:** these are [billed at the model's input rate][pricing], on top of the fee. OpenAI publishes no typical size for current models. The only published figure is a fixed 8,000 input tokens per call, and it applies only to `gpt-4o-mini` and `gpt-4.1-mini`. The estimates below borrow that number as a proxy.
- **What counts as a call:** [`search` actions incur the fee][websearch]. The guide does not say the same of `open_page` and `find_in_page`, and I did not confirm how those are billed.
- **Calls per Lesson:** reasoning models [decide for themselves whether to keep searching][websearch], so one Lesson can make several billed searches. The Mastra provider docs list a [`maxToolCalls` option][mastra-openai] that may cap this.

| Estimated cost per search | 8K content tokens (proxy) | 20K content tokens (assumed) | 128K (search context limit) |
| --- | ---: | ---: | ---: |
| `gpt-6-luna` | $0.011 | $0.012 | $0.023 |
| `gpt-6.1-terra` | $0.018 | $0.030 | $0.138 |
| `gpt-6.1-sol` | $0.026 | $0.050 | $0.266 |

The 128K column is a rough ceiling, using the [128K search context limit][websearch]. It is not an expected cost.

## Cost per Lesson (estimate)

**These are estimates. Every token count below is my assumption, not a measurement or a figure from OpenAI.** Only the prices are sourced. "One Lesson" means generating the Lesson, the conversation around it, and summarizing.

| Assumption | Low | Typical | High |
| --- | ---: | ---: | ---: |
| Lesson prompt input (instructions, UI spec, Mission, summary, latest 10 messages) | 6,000 | 6,500 | 8,000 |
| Searches per Lesson | 1 | 2 | 5 |
| Search content tokens per search | 8,000 | 8,000 | 20,000 |
| Lesson output, including reasoning tokens | 3,000 | 4,000 | 8,000 |
| Teacher turns per Lesson | 8 | 12 | 25 |
| Input per turn | 4,000 | 5,000 | 8,000 |
| Output per turn, including reasoning tokens | 300 | 500 | 1,000 |
| Summarizer runs per Lesson | 1 | 1 | 2 |
| Summarizer input / output per run | 2,000 / 300 | 3,000 / 400 | 5,000 / 600 |

Reasoning tokens are [billed as output][reasoning], so reasoning effort directly affects cost. The model also assumes no caching and one model call per Lesson.

| Estimated total per Lesson | Low | Typical | High |
| --- | ---: | ---: | ---: |
| Luna for everything | $0.02 | $0.03 | $0.10 |
| **Terra for Teacher and Lessons, Luna for summaries** | **$0.08** | **$0.15** | **$0.53** |
| Sol for Lessons, Terra for Teacher, Luna for summaries | $0.11 | $0.20 | $0.67 |
| Sol for everything | $0.16 | $0.30 | $1.03 |

Typical breakdown for the recommended setup:

| Part | Estimated cost |
| --- | ---: |
| Lesson tokens | $0.043 |
| Search fees | $0.020 |
| 12 Teacher turns | $0.090 |
| Summary | $0.001 |
| **Total** | **$0.15** |

So $5 of credit covers about 33 typical Lessons on this setup, or about 9 high-case ones.

**What moves the number most:**

- **Teacher turns:** the conversation costs more than the Lesson itself in the typical case, so the size of the context loop matters most.
- **Prompt caching:** it can help, but it is not free on these models. [Writes cost 1.25x input for 30-minute retention, and reads cost 0.05x on Terra][caching]. If a 3,000 token stable prefix is cached across 12 turns using explicit breakpoints, Terra chat input drops from about $0.06 to $0.03, and the typical Lesson falls to about $0.12. Prefixes under [1,024 tokens are not cached][caching].
- **Not counted:** the Mission interview at Workspace start, retries, and any extra model calls in a multi-step tool run.

The map already plans to show token usage per turn. Once that exists, those numbers should replace this table.

## Can a new key use these models and search?

**Short answer: yes after a $5 credit purchase. Without one, the docs do not confirm it.**

- **Tiers:** [Free, Build ($5 in total credit purchases), Launch ($100) and Grow ($500)][ratelimits]. Tiers upgrade automatically as purchases reach each threshold. OpenAI [reduced the paid tiers to three on 2026-10-06][changelog], so older material describing Tier 1 to 5 is out of date.
- **Build is enough:** the pages for [Luna][luna], [Terra][terra] and [Sol][sol] all list Build limits. Terra and Sol get 5,000 RPM and 1M TPM, and Luna gets 5,000 RPM and 2M TPM ([rate limits][ratelimits]). That is plenty for one learner.
- **Search needs no extra tier:** web search [uses the underlying model's tiered rate limits][websearch], and the guide lists no separate tier requirement.
- **Free tier is unclear:** the rate limits page lists Free with a $100 monthly usage limit, but the pages for Luna, Terra and Sol have no Free row. I checked 62 model pages. Only two legacy models show Free limits, at 3 RPM: `gpt-4o-mini-audio-preview` and `gpt-4o-mini-search-preview`, the latter [shut down on 2026-07-23][websearch].
- **No credit means errors:** an organization with no prepaid credit gets [HTTP 429 `credit_balance_exhausted`][errors].
- **Another route:** eligible ChatGPT Pro and Business subscribers can [claim free monthly API credits with no API payment method][credits], which suits some friends. Which rate limits those organizations get is not stated, so check the limits page.

**Verification:** none of the model pages I checked mention organization verification. The [reasoning guide][reasoning] says reasoning summaries on the latest models may require it. Teach Me should not request reasoning summaries in the MVP, so learners do not hit this.

## Consequences for the build

- **Use the Responses API.** Terra and Sol [require it for tool calling][terra]. On Luna, [Chat Completions supports function calling only with reasoning set to `none`][luna], and hosted tools need Responses. A Chat Completions route through Mastra would break the Teacher's tools.
- **Force search when a Lesson needs it.** With `tool_choice: "auto"`, [search is optional][websearch]. Since Lessons must cite Resources, use `required` for the Lesson step or check the citations afterwards.
- **Show citations.** OpenAI says inline citations [must be clearly visible and clickable][websearch] when web results are shown to end users. Generated Lesson UI needs to keep them. Use `url_citation` annotations for what was cited, and the `sources` field for the full list consulted.
- **Handle the key errors in onboarding.** `credit_balance_exhausted` is the out-of-credit case listed under "Not yet specified" on the map. Learner-set [hard spend limits][spend] return `429` too, with their own codes.
- **Do not pin a dated snapshot yet.** The [Luna][luna] and [Terra][terra] pages list only the undated alias, so behaviour may change without a new model ID. Keep model IDs in config.

## Open questions

1. **Does a fresh key with no credit work?** Docs do not settle it, and no test key was used. The fix is a one-minute call from a new organization. Until then, tell learners to buy $5.
2. **How many search content tokens do Terra and Luna actually use?** This is the largest unknown in search cost. Read it from `usage` in the first real runs.
3. **Does hosted `web_search` work through Mastra with a per-learner key?** Mastra's [OpenAI provider page][mastra-openai] lists `openai/gpt-6.1-terra` and `openai/gpt-6-luna` in its model router, and Responses-style options such as `previousResponseId`. I did not confirm which endpoint it calls or how to attach the hosted tool. The walking skeleton should test this.
4. **Is Terra good enough for Lessons?** Compare with Sol on a few real Lessons once they exist.

## Sources not read directly

The OpenAI Help Center returned HTTP 403 to automated fetches, so I could not read the articles on [prepaid billing][help-prepaid] or [organization verification][help-verify]. A web search summary of the billing article gave a $5 minimum purchase, credits that expire after one year, and no refunds, but it may be out of date. Check that article before putting these details in the UI. [openai.com/api/pricing][pricing-marketing] also returned 403; [platform.openai.com/docs/pricing][pricing-platform] redirects to the developer docs pricing page used here.

## Sources

- [Pricing][pricing]
- [Models][models]
- [Model selection][selection]
- [GPT-6 Luna][luna], [GPT-6.1 Terra][terra], [GPT-6.1 Sol][sol]
- [Web search guide][websearch]
- [Rate limits][ratelimits]
- [Prompt caching][caching]
- [Reasoning][reasoning]
- [Error codes][errors]
- [Spend limits][spend]
- [API credits for ChatGPT subscribers][credits]
- [Changelog][changelog]
- [Deprecations][deprecations]
- [Mastra: OpenAI provider][mastra-openai]

[pricing]: https://developers.openai.com/api/docs/pricing
[pricing-platform]: https://platform.openai.com/docs/pricing
[pricing-marketing]: https://openai.com/api/pricing/
[models]: https://developers.openai.com/api/docs/models
[selection]: https://developers.openai.com/api/docs/guides/model-selection
[luna]: https://developers.openai.com/api/docs/models/gpt-6-luna
[terra]: https://developers.openai.com/api/docs/models/gpt-6.1-terra
[sol]: https://developers.openai.com/api/docs/models/gpt-6.1-sol
[websearch]: https://developers.openai.com/api/docs/guides/tools-web-search
[ratelimits]: https://developers.openai.com/api/docs/guides/rate-limits
[caching]: https://developers.openai.com/api/docs/guides/prompt-caching
[reasoning]: https://developers.openai.com/api/docs/guides/reasoning
[errors]: https://developers.openai.com/api/docs/guides/error-codes
[spend]: https://developers.openai.com/api/docs/guides/spend-limits
[credits]: https://developers.openai.com/api/docs/guides/chatgpt-api-credits
[changelog]: https://developers.openai.com/api/docs/changelog
[deprecations]: https://developers.openai.com/api/docs/deprecations
[mastra-openai]: https://mastra.ai/models/providers/openai
[help-prepaid]: https://help.openai.com/en/articles/8264778
[help-verify]: https://help.openai.com/en/articles/10910291-api-organization-verification
