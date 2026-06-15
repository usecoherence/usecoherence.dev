Да, вот теперь стало понятно: **Coherence нельзя продавать как один demo scenario**. Это не “URL shortener demo”. Это **набор инженерных катастроф**, которые выглядят разными, но все сводятся к одному:

```txt
Important behavior exists somewhere.

But the current toolchain can’t keep it linked across:
requirements → specs → code → tests → commits → PR → CI → deploy → review history.
```

И поэтому я бы не делал матрицу как настоящий selector:

```txt
choose stack × choose architecture × choose use case
```

Потому что это комбинаторный ад. Пользователь будет думать: “а что мне выбрать?” — и уйдёт.

Я бы сделал наоборот:

```txt
Choose the pain.
Then show stack/architecture as flavor.
```

То есть главная навигация:

```txt
What broke this time?

1. New requirement shipped as vibes
2. Legacy behavior hidden in code
3. Bug tracker disappeared
4. Jira drifted away from code
5. Git diff can’t explain behavior
6. AI agent drowned in context
```

А уже внутри каждого use case маленькая плашка:

```txt
Example stack: Rails monolith
Architecture: legacy monolith
```

или:

```txt
Example stack: Node + Go + Rails
Architecture: 3 microservices
```

## Самая сильная модель страницы

Я бы сделал секцию:

```txt
Six failures Coherence is built to catch
```

И карточки.

---

# 1. New requirement → PR → LGTM → 500

Это тот сценарий, который мы уже разобрали.

Название:

```txt
The requirement entered as intent.
The PR shipped as vibes.
```

Показывает:

```txt
Requirement
↓
Code diff
↓
Empty PR description
↓
LGTM
↓
Green build
↓
Deploy
↓
500
```

Coherence version:

```txt
Requirement
↓
Spec
↓
AC
↓
Plan
↓
Runtime evidence
↓
Review gate
↓
Missing redirect evidence blocks merge
```

Главная фраза:

```txt
Review claims, not vibes.
```

---

# 2. Legacy behavior hidden in code

Вот этот сценарий прям жирный. Я бы его сделал вторым, потому что он отличается от “new requirement”.

Название:

```txt
The spec exists.
It’s just encoded as fear.
```

Или:

```txt
“Don’t touch this file” is not a specification.
```

Слева:

```txt
legacy_pricing_policy.rb

500–1000 lines
30 hidden acceptance criteria
200 tests around one god class
if enterprise_customer && migrated_before_2018 && trial_extension_used?
if region == "DE" && invoice_state == "pending" && ...
if weird_legacy_flag_enabled?
```

Дальше Coherence показывает диагностику:

```txt
Extracted shape:

SPEC
Legacy pricing policy

AC-1 trial users receive grace period
AC-2 enterprise migrated users keep old discount
AC-3 pending invoices block plan downgrade
...
AC-30 regional VAT override applies before coupon

Problems:
⚠️ 30 ACs under one spec
⚠️ AC-2 overlaps AC-7
⚠️ AC-1 is redundant if AC-13 exists
⚠️ 1 god class owns 24 ACs
⚠️ 1 AC is covered by 10 tests with conflicting names
⚠️ 9 tests assert implementation details, not behavior
```

Это очень сильный use case, потому что тут Coherence выглядит не как “ещё один тест раннер”, а как **behavior cartographer**.

Главный punchline:

```txt
Coherence turns legacy fear into reviewable claims.
```

И да, тут важно показать `wtf? давайте делить`:

```txt
Suggested split:

Pricing eligibility
Discount inheritance
Invoice blocking rules
Regional tax behavior
Migration compatibility
```

Не “автоматически всё починили”, а “мы нашли форму проблемы”.

---

# 3. Git commit references dead bug tracker

Очень хороший сценарий, потому что он про **history rot**.

Название:

```txt
The commit survived.
The reason didn’t.
```

Слева:

```txt
git log

feat(BUG-123): preserve old redirect behavior
fix(TRACKER-8821): don't validate archived URLs
hotfix(JIRA-491): skip billing sync for migrated users
```

А потом:

```txt
BUG-123 no longer exists.
Old Jira was deleted.
Linear was migrated.
Slack thread expired.
The engineer left 7 years ago.
```

Coherence version:

```txt
Commit links to AC diff, not just ticket ID.

AC-7 changed:
Before:
  Archived URLs are not redirectable.

After:
  Archived URLs remain redirectable for imported customers.

Reason:
  Enterprise migration compatibility.

Evidence:
  imported_customer_redirect_trace.json
  http_302_response.json
  db_snapshot.json

Review:
  accepted by migration team
```

Главная фраза:

```txt
Tickets are temporary.
Behavior history should not be.
```

Вот это прям можно поставить на карточку.

---

# 4. Jira drift: ticket says one thing, code ships another

Тут боль чуть другая: Jira не исчезла, но стала **не first-class artifact**.

Название:

```txt
Jira knows the task.
CI knows the commit.
Nobody knows the behavior.
```

Слева:

```txt
Jira story:
"As a user, I can downgrade my plan."

GitLab:
commit abc123 references PROJ-456

MR:
feat(subscription): support downgrade

CI:
✅ build
✅ tests
✅ deploy
```

Но Jira не знает:

```txt
Which ACs changed?
Which services were touched?
Which runtime evidence exists?
Which tests prove the story?
Whether implementation drifted from the ticket.
```

Coherence version:

```txt
Jira ticket imports into Spec/AC.

PROJ-456
↓
SPEC plan downgrade behavior
↓
AC-1 paid access remains until period end
AC-2 next invoice uses new plan
AC-3 audit event appears in admin UI
↓
Plans across billing, entitlements, admin UI
↓
Evidence attached back to PR/review
```

Главная фраза:

```txt
A ticket reference is not traceability.
```

Сочная.

---

# 5. Git diff vs SCIP/spec diff

Это, имхо, самый “developer brain explosion” сценарий.

Название:

```txt
Git shows changed lines.
Coherence shows changed behavior.
```

Слева обычный PR:

```txt
Files changed:
  app/controllers/redirects_controller.rb
  app/models/short_url.rb
  app/services/url_safety_checker.rb
  spec/requests/redirects_spec.rb

+184 -63
```

Reviewer думает:

```txt
Looks reasonable?
```

Справа Coherence/SCIP/Dolt view:

```txt
Symbols changed:
  RedirectsController#show
  ShortUrl#redirectable?
  UrlSafetyChecker#safe?
  ShortUrl.create_from_user_input

Linked ACs affected:
  AC-2 valid short links redirect with 302
  AC-5 unsafe URLs create zero records
  AC-9 imported URLs bypass safety check
  AC-11 archived URLs show 410

Behavior to re-test:
  redirect_valid_short_url
  reject_unsafe_url
  imported_customer_redirect
  archived_url_response
```

Главная фраза:

```txt
Line diffs are for patches.
Spec diffs are for behavior.
```

или ещё острее:

```txt
Git can tell you what changed.
It cannot tell you what claim you broke.
```

Вот это надо прям в демо.

---

# 6. AI agent drowns in context

Это будет самый актуальный сценарий для HN/AI crowd.

Название:

```txt
The agent doesn’t need more context.
It needs the right claims.
```

Слева:

```txt
Agent task:
"Implement downgrade behavior from Jira + Slack context."

Loads:
- Jira ticket
- Slack thread
- 5 repos
- README files
- random docs
- old tests
- 500k tokens of maybe-relevant code

Result:
🤞 plausible patch
```

Справа:

```txt
With Coherence:

Task
↓
Relevant specs found: 3
↓
Relevant ACs: 15
↓
Linked plans/tests: 15
↓
Linked code symbols across 3 repos
↓
Runtime evidence required before review

Context loaded:
~20k tokens
```

Главная фраза:

```txt
Context windows are not architecture.
```

Ох. Это прям надо куда-то вынести.

Ещё вариант:

```txt
Don’t stuff the whole company into the prompt.
Load the claims that matter.
```

---

## Я бы упаковал это как “Use case wall”

Не заставлять выбирать стек в начале. Сначала показать боли:

```txt
Coherence helps when...

[New requirement shipped as vibes]
[Legacy behavior is hidden in code]
[Bug tracker history disappeared]
[Jira drifted away from implementation]
[Git diff can’t explain behavior]
[AI agents drown in context]
```

Клик на карточку открывает мини-демо.

Каждое мини-демо одинакового формата:

```txt
Failure mode
What today’s tools show
What they miss
What Coherence links
What gets reviewed
```

Это будет очень легко расширять.

---

## А stack selector можно сделать вторичным

Например, внутри демо:

```txt
Example codebase:
[Rails] [Vite + API] [Next.js] [Django] [Go]
```

Но я бы для MVP сделал только 2 реально проработанных:

```txt
Rails monolith
3-service microservice system
```

А остальные табы можно показать как “planned examples” или лёгкие fake skins.

Потому что главный product message не “мы поддерживаем Rails”. Главный message:

```txt
The same traceability problem happens in every stack.
```

Стек — это приманка. Use case — это продажа.

---

## Лучший overall narrative

```txt
Software teams don’t lose information all at once.

They lose it one link at a time.

A requirement becomes a ticket.
A ticket becomes a PR.
A PR becomes a diff.
A diff becomes LGTM.
LGTM becomes a deploy.
A deploy becomes a production incident.

Coherence keeps the claim alive.
```

Вот это, имхо, прям почти landing-page copy.

---

## Что показывать как “сейчас” и “будущее”

Тебе надо разделить use cases на два слоя:

```txt
Can demonstrate now:
1. New requirement → Spec/AC/Plan/Run/Evidence/Review
2. Legacy behavior → AC explosion / test mapping / god-class smell
3. Git diff vs spec diff, хотя бы концептуально

Future / roadmap:
4. Deep SCIP symbol diff
5. Multi-repo microservice runtime plans
6. AI agent context minimization
7. Long-lived behavior history after Jira/GitHub issue rot
```

Не потому что future слабее. А потому что если всё заявить как “уже работает”, будет пахнуть vaporware. Если сказать:

```txt
Here is the model.
Here is the first working slice.
Here is where it goes next.
```

— наоборот, будет честно и интересно.

---

## Моё мнение: главный use case для первого wow

Я бы выбрал не microservices и не AI agent context.

Я бы выбрал **legacy hidden AC**.

Почему? Потому что это уникальнее.

“PR green but prod 500” — все понимают, но много инструментов могут сказать “мы улучшим CI”.

А вот:

```txt
This 900-line god class contains 30 hidden acceptance criteria,
some redundant, some overlapping, some tested 10 times,
some not tested at all.
```

— это уже звучит как новая категория инструмента.

Тут Coherence становится не “better testing”, а:

```txt
behavior archaeology + runtime evidence + reviewable claims
```

Очень вкусно.

Hero можно сделать так:

```txt
Your codebase already has specs.
They’re just trapped in tickets, tests, commits, Slack threads, and weird if-statements.

Coherence turns them back into reviewable runtime claims.
```

Вот это, кажется, попадает во все твои use cases сразу.

