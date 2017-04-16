# Contributors

Many people have helped make log4js what it is today. Here's a list of everyone who has contributed to the code. There are lots of people who've helped by submitting bug reports or pull requests that I haven't merged, but I have used their ideas to implement a different way. Thanks to you all. This library also owes a huge amount to the [original log4js project](https://github.com/stritti/log4js). If you'd like to help out, take a look at the [contributor guidelines](contrib-guidelines.md). 

<ul>
{% for contributor in site.github.contributors %}
<li><a href="{{ contributor.html_url }}">{{ contributor.login }}</a></li>
{% endfor %}
</ul>
