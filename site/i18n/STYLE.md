# Translations: rules and status

One folder per language (`en`, `tr`, `es`, `nl`, `ja`), the same files and keys in each:
`common.json` (navigation, menu, consent, on every page), `home.json`, `fit.json`.
`en` is the source; the HTML carries the same English, so a missing key falls back to English.
Keys starting with `_` are notes and are never shown.

Translated: navigation, the menu, the consent pill, the home page's hero, hiring card and section
headings, and the whole Fit check. Case studies, papers and updates stay in English for now, and a
note in the menu says so. The Fit check scores **English** job descriptions (its skill patterns
are English), and each language says that where it matters.

## Principle: meaning, not words
Each string is rewritten the way a native speaker in tech would say it, not translated word for
word: natural collocations (TR *iş piyasası*, ES *mercado laboral*, NL *arbeidsmarkt*, JA
*採用市場*), each language's usual headline rhythm, and the terms practitioners actually use.
Where a field keeps the English word (harness, evals, embeddings, forward deployed engineer),
it stays in English rather than being forced into a literal coinage. No em dashes, and nothing
is added that the English does not say.

## Status
| Language | Standard followed | Register | Review |
| --- | --- | --- | --- |
| Türkçe | [TDK Yazım Kılavuzu](https://tdk.gov.tr) | siz (formal) | Draft. Vahid reviews as a native speaker. |
| Español | [RAE y ASALE, *Ortografía* (2010)](https://www.rae.es) | tú, neutral international | Draft. Vahid reviews (Spanish instructor). |
| Nederlands | [Taalunie *Woordenlijst*](https://woordenlijst.org) and [Taaladvies](https://taaladvies.net) | je | Draft. **Needs a native Dutch reviewer.** |
| 日本語 | 文化庁「[公用文作成の考え方](https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93731901_01.pdf)」(2022), JTF日本語標準スタイルガイド | です・ます調 | Draft. **Needs a native Japanese reviewer.** |

These drafts were written string by string for their context by an AI assistant (Claude), following
the standards above, not pasted from a translation engine. That is still not a review: change a
file's `_status` only once a native speaker has signed it off.

## Rules applied
**Türkçe (TDK)**
- Suffixes on proper names and abbreviations take an apostrophe: *Vahid'in*, *GPU'lar*.
  Language names in *-ce* do not: *İngilizcedir*.
- *yapay zekâ* keeps the circumflex; *e-posta*; sentence case in headings.
- Formal *siz* throughout, as a hiring audience expects.

**Español (RAE/ASALE)**
- Opening ¿ and ¡; sentence case in titles (only the first word and proper names capitalised).
- *inteligencia artificial* in lower case, *IA* as the acronym; *currículum* with its accent.
- English terms replaced where Spanish has an established one: *canalizaciones de datos*,
  *ajuste fino*. *ROI* and *MCP* stay as acronyms. *costo* (valid in all varieties).

**Nederlands (Taalunie)**
- Compounds are written as one word, with a hyphen after an acronym: *vacaturecheck*,
  *dataproducten*, *AI-engineer*, *ML-training*.
- *cv* and *pdf* in lower case; plural *demo's*, *gpu's*; possessive *Vahids* without an apostrophe.
- Informal *je*, the norm for Dutch interfaces. English job titles stay where Dutch uses them.

**日本語（公用文作成の考え方・JTF）**
- です・ます調で統一。句読点は全角の「、」「。」、疑問符は全角「？」の後に全角スペース。
- 和文と半角英数字の間にスペースを入れない（例：Vahidのエージェント、Googleカレンダー）。
- 外来語はカタカナ表記（エージェント、プロダクト）。AI・MCP・ROI など略語は半角英字のまま。
- 主語と述語の語順に合わせ、ヒーローは「Vahidは／応用AIに取り組んでいます。」の形にする。

## Adding a language
1. Copy `en/` to the new code, translate every value, set `_language`, `_standard`, `_status`.
2. Add it to `LANGS` in `assets/brand/i18n.js` with its sign letter.
3. Run the pages with `?lang=<code>` and check the header at 320 px.
