import cockpit from "cockpit";
import QUnit from "qunit-tests";

QUnit.test("basic", function (assert) {
    window.location.hash = "";

    assert.equal(typeof cockpit.location, "object", "cockpit.location exists");
    assert.ok(Array.isArray(cockpit.location.path), "cockpit.location.path exists");
    assert.equal(typeof cockpit.location.options, "object", "cockpit.location.options exists");
    assert.equal(typeof cockpit.location.go, "function", "cockpit.location.go exists");
    assert.equal(typeof cockpit.location.replace, "function", "cockpit.location.replace exists");
    assert.equal(typeof cockpit.location.decode, "function", "cockpit.location.decode exists");
    assert.equal(typeof cockpit.location.encode, "function", "cockpit.location.encode exists");

    assert.deepEqual(cockpit.location.path, [], "path is empty");
    assert.deepEqual(cockpit.location.options, { }, "options are empty");
});

QUnit.test("decode", function (assert) {
    window.location.hash = "#/base/test";

    const checks = [
        ["#/host/path/sub?a=1&b=2", {
            path: ["host", "path", "sub"],
            options: { a: "1", b: "2" }
        }
        ],
        ["", {
            path: [],
            options: { }
        }
        ],
        ["#", {
            path: [],
            options: { }
        }
        ],
        ["#/", {
            path: [],
            options: { }
        }
        ],
        ["/horst", {
            path: ["horst"],
            options: { }
        }
        ],
        ["//one", {
            path: ["one"],
            options: { }
        }
        ],
        ["//one/", {
            path: ["one"],
            options: { }
        }
        ],
        ["///two", {
            path: ["two"],
            options: { }
        }
        ],
        ["/slash/%2f", {
            path: ["slash", "/"],
            options: { }
        }
        ],
        ["?a=1", {
            path: [],
            options: { a: "1" }
        }
        ],
        ["?a=1&a=2", {
            path: [],
            options: { a: ["1", "2"] }
        }
        ],
        ["?%3f=%3d", {
            path: [],
            options: { "?": "=" }
        }
        ],
        ["#?=", {
            path: [],
            options: { "": "" }
        }
        ],
        ["?=", {
            path: [],
            options: { "": "" }
        }
        ],
        ["relative/sub", {
            path: ["base", "relative", "sub"],
            options: { }
        }
        ],
        ["./relative/sub", {
            path: ["base", "relative", "sub"],
            options: { }
        }
        ],
        ["../relative/sub", {
            path: ["relative", "sub"],
            options: { }
        }
        ],
        ["/top/../sub", {
            path: ["sub"],
            options: { }
        }
        ],
        ["/top/./sub/./", {
            path: ["top", "sub"],
            options: { }
        }
        ],
        ["relative/../sub", {
            path: ["base", "sub"],
            options: { }
        }
        ]
    ];

    assert.expect(checks.length);
    for (let i = 0; i < checks.length; i++) {
        const options = { };
        const path = cockpit.location.decode(checks[i][0], options);
        assert.deepEqual({ path, options }, checks[i][1], "decode(\"" + checks[i][0] + "\")");
    }
});

QUnit.test("encode", function (assert) {
    /* We don't check options here since we can't predict the order in
       which they appear in the hash.  Encoding of options is covered
       in the "roundtrip" test.
    */
    const checks = [
        ["/host/path/sub?a=1&b=2", {
            path: ["host", "path", "sub"],
            options: { a: "1", b: "2" }
        }
        ],
        ["/one", {
            path: ["one"],
            options: { }
        }
        ],
        ["/one/two", {
            path: ["one", "two"],
            options: { }
        }
        ],
        ["/slash/%2F", {
            path: ["slash", "/"],
            options: { }
        }
        ],
        ["/p?a=1", {
            path: ["p"],
            options: { a: "1" }
        }
        ],
        ["/p?%3F=%3D", {
            path: ["p"],
            options: { "?": "=" }
        }
        ],
        ["/p?=", {
            path: ["p"],
            options: { "": "" }
        }
        ],
        ["/p?value=one&value=two", {
            path: ["p"],
            options: { value: ["one", "two"] }
        }]
    ];

    assert.expect(checks.length);
    for (let i = 0; i < checks.length; i++) {
        const encoded = cockpit.location.encode(checks[i][1].path, checks[i][1].options);
        assert.strictEqual(encoded, checks[i][0], "encode(" + JSON.stringify(checks[i][1]) + ")");
    }
});

QUnit.test("roundtrip", function (assert) {
    const checks = [
        {
            path: ["path", "sub"],
            options: { a: "1", b: "2" }
        },
        {
            path: ["päth", "süb"],
            options: { a: "1", b: "2" }
        },
        {
            path: ["/=()?", "$%&/"],
            options: { "": "=$&%", b: "=2%34" }
        },
    ];

    assert.expect(checks.length);
    for (let i = 0; i < checks.length; i++) {
        const encoded = cockpit.location.encode(checks[i].path, checks[i].options);
        const decoded = { options: { } };
        decoded.path = cockpit.location.decode(encoded, decoded.options);
        assert.deepEqual(decoded, checks[i], "roundtrip(" + JSON.stringify(checks[i]) + ")");
    }
});

QUnit.test("external change", function (assert) {
    const location = cockpit.location;

    window.location.hash = "#/a/b/c?x=1&y=2";

    assert.notStrictEqual(cockpit.location, location, "cockpit.location is different object");
    assert.deepEqual(cockpit.location.path, ["a", "b", "c"], "path is correct");
    assert.strictEqual(cockpit.location.options.x, "1", "option x is correct");
    assert.strictEqual(cockpit.location.options.y, "2", "option y is correct");
});

QUnit.test("internal change", function (assert) {
    cockpit.location.go(["x", "y", "z"]);

    assert.strictEqual(window.location.hash, "#/x/y/z", "hash is correct");
    assert.deepEqual(cockpit.location.path, ["x", "y", "z"], "path is correct");
    assert.deepEqual(cockpit.location.options, { }, "options are empty");
});

QUnit.test("string change", function (assert) {
    cockpit.location = "/p/x/../q/r?a=b";

    assert.strictEqual(window.location.hash, "#/p/q/r?a=b", "hash is correct");
    assert.deepEqual(cockpit.location.path, ["p", "q", "r"], "path is correct");
    assert.deepEqual(cockpit.location.options, { a: "b" }, "options are empty");
});

QUnit.test("string change", function (assert) {
    window.location.href = "#/top/file";
    cockpit.location = "another";

    assert.strictEqual(window.location.hash, "#/top/another", "hash is correct");
    assert.deepEqual(cockpit.location.path, ["top", "another"], "path is correct");
});

QUnit.test("change options", function (assert) {
    window.location.hash = "";
    assert.deepEqual(cockpit.location.path, [], "path is empty");
    assert.deepEqual(cockpit.location.options, { }, "options are empty");

    cockpit.location.go(cockpit.location.path, { x: "1" });
    assert.deepEqual(cockpit.location.options, { x: "1" }, "options are correct");
    assert.strictEqual(window.location.hash, "#/?x=1", "hash is correct");

    cockpit.location.go(cockpit.location.path);
    assert.deepEqual(cockpit.location.options, { }, "options are empty");
    assert.strictEqual(window.location.hash, "#/", "hash is correct");
});

QUnit.test("test", function (assert) {
    const done = assert.async();
    window.location.hash = "#/hello";

    let triggered = false;

    assert.deepEqual(cockpit.location.path, ["hello"], "path is right");
    const onLocationChanged = () => {
        assert.strictEqual(window.location.hash, "#/gonna-happen", "hash has changed");
        cockpit.removeEventListener("locationchanged", onLocationChanged);
        triggered = true;
        done();
    };
    cockpit.addEventListener("locationchanged", onLocationChanged);

    cockpit.location.go(["gonna-happen"]);
    assert.ok(!triggered, "not yet triggered");
});

QUnit.test("test", function (assert) {
    const done = assert.async();
    window.location.hash = "#/hello";

    const location = cockpit.location;
    assert.deepEqual(cockpit.location.path, ["hello"], "path is right");

    window.setTimeout(function() {
        /* window.location.hash has changed so the old `location` object is no longer valid and .go/replace are ignored */
        location.go(["not-gonna-happen"]);
        assert.strictEqual(window.location.hash, "#/other", "hash is correct");

        cockpit.location.go(["gonna-happen"]);
        assert.strictEqual(window.location.hash, "#/gonna-happen", "hash has changed");

        done();
    }, 100);

    /* User or something else navigates */
    window.location.hash = "#/other";
});

/* Set url_root in beforeEach so the test does not flake */
QUnit.module("url_root tests", {
    beforeEach: () => {
        window.mock = { url_root: "cockpit" };
    },
    afterEach: () => {
        window.mock = null;
    }
});

QUnit.test("encode", assert => {
    let path = cockpit.location.encode("path", "", true);
    assert.equal(path, "/cockpit/path", "path is correct");
    /* an existing url_root should not be prepended */
    path = cockpit.location.encode("/cockpit/path", "", true);
    assert.equal(path, "/cockpit/path", "path is correct");
});

QUnit.start();
