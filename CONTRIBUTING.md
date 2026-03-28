# Contributing to Spades 27

Thanks for your interest in contributing! We welcome pull requests.

## Getting Started

```bash
git clone https://github.com/keithadler/spades27.git
cd spades27
python3 -m http.server 8080
# Open http://localhost:8080
```

No build step, no dependencies. Just HTML/CSS/JS.

## Running Tests

```bash
node test.js
```

## We Especially Welcome

- New languages (with authentic cultural phrases)
- Accessibility improvements
- AI strategy enhancements
- Mobile/touch UX refinements
- Card skin designs
- Bug reports with reproduction steps

## Adding a New Language

1. Add a `LOCALES.xx` entry in `locales.js` following the `LOCALES.en` structure
2. Include: `name`, `flag`, `dir` (ltr/rtl), `names[]`, `cities[]`, `ui{}`, `p{}` (phrases)
3. Add rules HTML to the `RULES` object at the bottom of `locales.js`
4. All UI keys are listed in the English `ui` object — translate every key
5. Phrases should be culturally authentic, not machine-translated
6. Test RTL layout if applicable

## Code Style

- No frameworks, no build tools, no dependencies
- Vanilla JS with JSDoc comments
- CSS in a single file with section comments
- Keep it readable — plain English comments preferred

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
