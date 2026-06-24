---
layout: layout.njk
title: Coherence Ideas
description: Raw notes and design sketches for Coherence.
---

# Ideas

{%- for idea in collections.ideas %}
- [{{ idea.data.title }}]({{ idea.page.url }}){% if idea.data.description %} — {{ idea.data.description }}{% endif %}
{%- endfor %}
