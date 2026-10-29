---
title: Portfolio
layout: base.njk
permalink: /index.html
---

<ul>
{%- for item in collections.projects %}
  <li><a href="{{ item.url }}">{{ item.data.title }}</a></li>
{%- endfor %}
</ul>
