This is a terribly inefficient attempt at building a 3D engine in WebGL
using no dependencies (with the exception of preact, which is used
for a rudimentary user interface).

It is being built primarily for educational purposes.

## Quick start

```
npm install
npm start
```

Then visit http://localhost:8080 in a browser.

## Deployment

To build a deployment for hosting on a static site, run:

```
npm run build
```

Then copy the `static` folder somewhere. You can also run
`npm run deploy` to both build the site and deploy it to GitHub Pages.

## License

This is free and unencumbered software released into the public domain.

## External resources

The following resources were helpful in figuring out how to do
any of this:

* Grant Sanderson's [Essence of Linear Algebra](http://www.3blue1brown.com/essence-of-linear-algebra-page/) videos
* Greggman's [WebGL Fundamentals](https://webglfundamentals.org/)
* Song Ho Ahn's [OpenGL tutorials and notes](http://www.songho.ca/opengl/index.html)
* [Real-Time Rendering](http://www.realtimerendering.com/) by Tomas Akenine-Möller, Eric Haines, Naty Hoffman, Angelo Pesce, Michał Iwanicki, and Sébastien Hillaire, Fourth edition
