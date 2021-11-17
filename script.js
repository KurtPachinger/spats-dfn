var cat = "";
var sco = "";

/*TO-DO:
timing through Matter.js delta
pause on window blur
more fps on low-end device
prevent touch/drag except on Hill
*/
//css-tricks.com/svg-sprites-use-better-icon-fonts/

//raw.githubusercontent.com/liabru/matter-js/master/examples/bridge.js
var Example = Example || {};
Example.bridge = function () {
  var mult =
    document.getElementsByTagName("html")[0].className.indexOf("MS") > 0
      ? 6
      : 1;

  var {
    Engine,
    Render,
    Runner,
    Body,
    Composites,
    Common,
    Constraint,
    MouseConstraint,
    Mouse,
    World,
    Bodies
  } = Matter;

  //Game Settings
  var sto = {
    curr: [0, 0, false],
    time: [],
    item: {},
    stat: {
      level: [
        // delay, no enemy 1/2/3, boss cell/text
        { sec: 6, ext: [2, 1, 1], boss: [8, "Snakey Shake", "mimic"] },
        { sec: 4, ext: [1, 2, 1], boss: [12, "Perry Pearly", "mimic"] },
        { sec: 3, ext: [2, 2, 1], boss: [16, "Final Finale", "gyro"] }
      ],
      item: [
        "sweetgum",
        "branch",
        "holly",
        "cherries",
        "pinecone",
        "leaf",
        "egg",
        /*"apple", "peach",*/ "snake",
        /*"ladybug",*/ "firefly",
        /*"acorn",*/ "disc",
        "boomerang",
        "baseball",
        "football",
        "honeybee",
        "rock",
        "icicle",
        "flower",
        /*"star",*/ "dewdrop",
        "vine",
        "spaceship",
        "plane",
        "balloon" /*"heart", "regrow", "shock"*/
      ],
      //
      power: 100,
      score: 0,
      shots: 4
    },
    char: {
      //anim svg no responsive output for device compat
      spats:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(document.getElementById("spats").outerHTML),
      //svg backgrounds not working
      warns: document.getElementById("warns").src,
      cloud: document.getElementById("cloud").src
    }
  };

  $("#game").css(
    "background-image",
    "url(" + sto.char.cloud + "), url(" + sto.char.cloud + ")"
  );
  $("hr#boss").css(
    "background-image",
    "url(" + sto.char.warns + "), url(" + sto.char.warns + ")"
  );

  // create engine
  var engine = Engine.create(),
    world = engine.world;

  // create renderer
  var render = Render.create({
    element: document.getElementById("game"),
    engine: engine,
    options: {
      width: 640,
      height: 480,
      pixelRatio: 1,
      background: "transparent",
      wireframes: false
    }
  });

  Render.run(render);

  // create runner
  var runner = Runner.create({
    isFixed: true,
    fps: 3,
    delta: 17.5
  });
  Runner.run(runner, engine);
  var tick = runner.delta * 60;

  var bridges = function () {
    bridge = Composites.stack(640, 480, 2, 1, 2, 1, function (x, y) {
      return Bodies.rectangle(x, y, 186, 16, {
        label: "bridge",
        friction: 0,
        density: 0.5,
        restitution: 0.75,
        slop: 0.25,
        render: { fillStyle: Common.choose(["#666", "#444"]) },
        collisionFilter: { collidesWith: [1, 2] },
        chamfer: { radius: 4, quality: 3 }
      });
    });

    Composites.chain(bridge, 0.4, 0, -0.4, 0);
    return bridge;
  }; //make bridges

  var bridgeA = bridges(),
    bridgeB = bridges();

  //Enemy or Item
  function wave() {
    var curr = sto.curr;
    var level = sto.stat.level[curr[0]];

    sto.time[0] = setTimeout(function () {
      $("canvas").focus();
      var end = 0;
      for (var e = 0; e < level.ext.length; e++) {
        end += level.ext[e];
      }

      if (end === 0) {
        sto.curr[1] = 0;
        sto.curr[2] = true;
        $("body").addClass("boss");
      } else {
        $("body").removeClass("boss");
        $("#msg").text("");
      }

      //Info
      console.log(curr);
      console.log(sto.stat.level[curr[0]].ext);
      console.log("left=" + end);

      var type,
        cellX = Math.floor(Math.random() * 4 + 1),
        cellY = 4,
        //posX range/offsets
        posX = 8 + (632 - (cellX * 32 + 40) * (sto.curr[1] + 1)) / 4,
        posY = -128,
        offX = 0,
        tex = sto.char.warns,
        hex = ["#464", "#446", "#646", "#644"];

      if (sto.curr[2]) {
        //Boss
        cellX = level.boss[0];
        cellY = 1;
        hex[level.boss[0] - 1] = "#fff";
      } else if (curr[1] == level.ext.length - 1) {
        //Last
        cellX = 2;
        cellY = 2;
        posX = 320;
        posY = -196;
        tex = "";
        hex[1] = "#333";
      }

      function enemy() {
        blocks = Composites.softBody(
          posX + offX,
          posY,
          cellX,
          cellY,
          0,
          0,
          true,
          16,
          {
            timeScale: 1 / cellX, //larger slower
            slop: 0.75, //jigglypuff
            friction: 0.5,
            restitution: 0.25,
            density: 0.05 * cellX,
            torque: 8,
            label: "enemy",
            time: Date.now(),
            render: {
              fillStyle: hex[cellX - 1],
              sprite: { texture: tex, xScale: 2, yScale: 12 }
            },
            collisionFilter: {
              group: 2,
              collidesWith: [0, 1, 2]
            }
          }
        );
        return blocks;
      } //template for type

      for (var i = 0; i <= sto.curr[1]; i++) {
        if (!curr[2]) {
          offX = i * (cellX * 32 + 40);
        }

        type = enemy();
        sto.item[type.id] = type;
        World.add(world, sto.item[type.id]);

        if (!curr[2]) {
          remove(type.id, tick * 15);
        } else {
          type.bodies[0].circleRadius = 20;
          var len = type.bodies.length;
          sto.time[1] = setInterval(function () {
            Body.setVelocity(type.bodies[0], { x: -2, y: 4 });
            Body.setVelocity(type.bodies[len / 2], { x: 0, y: -4 });
            Body.setVelocity(type.bodies[len - 1], { x: 4, y: 2 });
          }, tick * 1);
        }

        sto.item[type.id].bodies.forEach(function (el) {
          //Remove Warning Sprite
          setTimeout(function () {
            delete el.render.sprite;
          }, tick * 0.5);
          //Rotate Last 90-Degree
          if (curr[1] == level.ext.length - 1) {
            el.timeScale = 2;
            Matter.Body.rotate(el, 1.5, { x: posX, y: posY });
          }
          //Boss Weight/Game Over
          if (curr[2]) {
            el.timeScale = 0.33;
            el.label = "boss";
          }
        });

        //Spats Toward Enemy and sprite animation
        var currX = spats.position.x,
          movX = posX > currX ? 0.075 : -0.075;
        if (currX > 256 && currX < 384) {
          Body.setVelocity(spats, { x: movX, y: -1.5 });
        } else {
          Body.setVelocity(spats, { x: -movX, y: -1.5 });
        }

        $("#antennae, #head").attr(
          "transform",
          "translate(0 " + (5 + 30 * movX) + ")"
        );
        $("#eyelidTop").attr(
          "transform",
          "translate(0 " + Math.floor(Math.random() * 3 + 1) * 1.5 + ")"
        );
        $("#eyelidBottom").attr(
          "transform",
          "translate(0 " + Math.floor(Math.random() * 2 + 1) * -3 + ")"
        );
        $("#mouth-2, #tooth").attr(
          "transform",
          "translate(0 " + 30 * movX + ")"
        );
        $("#legL").attr(
          "transform",
          "translate(0 " + (-2 + 40 * movX * -1) + ")"
        );
        $("#legR").attr("transform", "translate(0 " + (-2 + 40 * movX) + ")");

        spats.render.sprite.texture =
          "data:image/svg+xml;utf8," +
          encodeURIComponent(document.getElementById("spats").outerHTML);
      } //loop no. enemies

      //Level Progress
      function nxt() {
        //Enemy Current Reduce
        sto.stat.level[curr[0]].ext[curr[1]]--;

        //Enemy Next Find !=0
        var idx = curr[1];
        for (var i = 0; i < level.ext.length; i++) {
          if (idx < level.ext.length - 1) {
            idx++;
          } else {
            idx = 0;
          }
          if (sto.stat.level[curr[0]].ext[idx] !== 0) {
            console.log("next=" + idx);
            return idx;
          }
        }
      }
      sto.curr[1] = nxt();

      //Level Enemies or Boss
      if (curr[2]) {
        $("#level").val(curr[0] + "-B");
        $("#msg").text(level.boss[1]);
        $("#ico").attr("xlink:href", "#" + level.boss[2]);
        $(".texture").removeClass("air space").addClass("fire");
      } else {
        $("#level").val(curr[0] + "");
        clearTimeout(sto.time[0]);
        $("#ico").attr("xlink:href", "#" + sto.stat.item[0]);
        $(".texture").removeClass("fire").addClass("air");
        console.log(sto.stat.item[0]);
        sto.stat.item.push(sto.stat.item.shift());
        wave();
      }
    }, tick * sto.stat.level[curr[0]].sec);
  } //wave

  console.clear();
  console.warn("START!");
  wave();

  //Ammunition
  function fire(shots) {
    if (sto.stat.shots > 0) {
      var type = Bodies.circle(shots[0], shots[1], 32, {
        friction: 0.25,
        restitution: 1,
        density: 0.5,
        torque: 2,
        label: "shots",
        render: { fillStyle: "#999" },
        collisionFilter: {
          group: 1,
          collidesWith: [0, 1, 2]
        }
      });
      sto.item[type.id] = type;
      World.add(world, sto.item[type.id]);
      sto.stat.shots--;
      //remove(type.id, tick*10);

      Body.setVelocity(type, { x: shots[2], y: -6 });
    }
  }

  var floor = Bodies.rectangle(320, 480, 240, 100, {
    label: "floor",
    density: 0.5,
    isStatic: true,
    chamfer: { radius: 8, quality: 3 },
    render: { fillStyle: "#666" },
    collisionFilter: {
      group: 0,
      collidesWith: [0]
    }
  });

  var spats = Bodies.rectangle(320, 360, 48, 74, {
    label: "spats",
    density: 22,
    restitution: 0.25,
    render: {
      fillStyle: "#666",
      sprite: {
        texture: sto.char.spats,
        xScale: 0.8 * mult,
        yScale: 0.8 * mult
      }
    },
    collisionFilter: {
      group: 0,
      collidesWith: [0]
    }
  });

  //World Bodies
  World.add(world, [
    floor,
    spats,
    bridgeA,
    Constraint.create({
      pointA: { x: 0, y: 480 },
      bodyB: bridgeA.bodies[0],
      stiffness: 0.4,
      length: 2
    }),
    Constraint.create({
      pointA: { x: 320, y: 240 },
      bodyB: bridgeA.bodies[1],
      pointB: { x: 48, y: 0 },
      stiffness: 0.4,
      length: 2
    }),
    bridgeB,
    Constraint.create({
      pointA: { x: 640, y: 480 },
      bodyB: bridgeB.bodies[1],
      stiffness: 0.4,
      length: 2
    }),
    Constraint.create({
      pointA: { x: 320, y: 240 },
      bodyB: bridgeB.bodies[0],
      pointB: { x: -48, y: 0 },
      stiffness: 0.4,
      length: 2
    }),
    //cross-bar
    Constraint.create({
      bodyA: bridgeA.bodies[1],
      bodyB: bridgeB.bodies[0],
      stiffness: 0.4,
      length: 128
    })
  ]);

  //Collisions/Damage/Stats
  Matter.Events.on(engine, "collisionStart", function (event) {
    var pairs = event.pairs;

    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i],
        //bodyB impacts bodyA?
        bodyA = pair.bodyA,
        bodyB = pair.bodyB,
        group = false;

      //Collision within Group
      if (bodyA.time && bodyA.time == bodyB.time) {
        group = true;
      }

      //Collision Pairs
      var pairsLabel = bodyA.label + bodyB.label;
      //console.log(pairsLabel)
      if (
        pairsLabel == "enemyshots" ||
        pairsLabel == "shotsenemy" ||
        pairsLabel == "shotsshots" ||
        pairsLabel == "enemyenemy" ||
        pairsLabel == "bossshots" ||
        pairsLabel == "shotsboss" ||
        pairsLabel == "bossboss"
      ) {
        if (!group) {
          bodyA.render.opacity > 0.6 ? hit(bodyA) : end(bodyA);
          if (pairsLabel == "enemyshots" || pairsLabel == "bossshots") {
            sto.stat.score += 1;
            if (sto.stat.score % 100 === 0) {
              sto.stat.power += 25;
            }
          }
        } else {
          bodyA.render.opacity > 0.6 ? hit(bodyA, 0.005) : end(bodyA, 0.005);
          bodyA.frictionAir += 0.005;
        }
      } else if (
        pairsLabel == "enemybridge" ||
        pairsLabel == "bridgeenemy" ||
        pairsLabel == "bossbridge" ||
        pairsLabel == "bridgeboss"
      ) {
        bodyB.render.opacity > 0.6 ? hit(bodyB) : end(bodyB);
      }

      //Filter Groups Affected
      if (bodyA.label == "bridge") {
        //Collision Verticality
        Body.setVelocity(bodyB, {
          x: bodyB.velocity.x * 1.5,
          y: bodyB.velocity.y / 16
        });
        //Enemy/Boss
        if (
          (pairsLabel == "bridgeenemy" || pairsLabel == "bridgeboss") &&
          sto.stat.power > 0
        ) {
          Body.scale(floor, 1, 0.994, { x: 320, y: 480 });
          sto.stat.power--;

          if (sto.stat.power <= 0) {
            $(".start a").text("You Lost. Retry?");

            //Google Analytics
            sco = sto.stat.score.toString();
            console.log(sto.stat.score);
            try {
              gtag("event", sco, { event_category: "lose" });
            } catch (e) {
              console.log(e.name);
            }

            reset();
          }
        }
      }
    } //hits

    function hit(body, amt) {
      amt = amt || 0.2;
      body.render.opacity -= amt;
    } //hit

    function end(body) {
      body.isDone = true;
      body.render.fillStyle = "#966";
      body.frictionAir = 0.025;
    } //end

    document.getElementById("power").value = sto.stat.power;
    document.getElementById("score").value = sto.stat.score;
  });

  //Monkeypatch for the Matter.detector.Detector.canCollide method
  Matter.Detector.canCollide = function (filterA, filterB) {
    return (
      (filterB.collidesWith.includes(filterA.group) || filterB.group === 0) &&
      (filterA.collidesWith.includes(filterB.group) || filterA.group === 0)
    );
  };

  // add mouse control
  var mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
      collisionFilter: {
        collidesWith: []
      },
      mouse: mouse,
      constraint: {
        render: { visible: true }
      }
    });
  World.add(world, mouseConstraint);
  // keep the mouse in sync with rendering
  render.mouse = mouse;

  // fit the render viewport to the scene
  Render.lookAt(render, {
    min: { x: 0, y: 0 },
    max: { x: 640, y: 480 }
  });

  //Helper: Remove Body from World
  function remove(id, timeout) {
    var rem = setTimeout(function () {
      if (sto.item[id]) {
        World.remove(world, sto.item[id]);
        delete sto.item[id];
      }
      clearTimeout(rem);
    }, timeout);
  }

  //Helper: Body Left World Limits
  function isGone(x, y) {
    var pad = 64,
      rX = render.options.width + pad,
      rY = render.options.height + pad;

    var offX = x < -pad || x > rX;
    var offY = y < -pad || y > rY;

    return offX && offY;
  }

  //Loop: World Cleanup

  sto.time[1] = setInterval(function () {
    var items = sto.item;
    //console.log(items);

    for (var parent in items) {
      var item = items[parent];

      if (item.label == "shots") {
        if (item.isDone || isGone(item.position.x, item.position.y)) {
          remove(item.id, tick * 0.25);
          sto.stat.shots++;
        }
      } else if (item.label == "warn") {
        remove(item.id, tick * 0.25);
      } else if (item.bodies.length) {
        //console.log(item);

        var bodies = item.bodies,
          isDoneGroup = 0;

        for (var child in bodies) {
          if (bodies[child].isDone) {
            isDoneGroup++;
          }
        } //loop children

        //console.log(item.bodies);
        if (
          isDoneGroup / bodies.length >= 0.7 ||
          isGone(bodies[0].position.x, bodies[0].position.y)
        ) {
          //test
          if (item.bodies[0].label == "boss") {
            if (sto.curr[0] < sto.stat.level.length - 1) {
              //Next Level and Some Health
              sto.curr[0]++;
              sto.curr[2] = false;
              sto.stat.power += 20;
              clearTimeout(sto.time[0]);
              wave();
              $("#ico").attr("xlink:href", "");
            } else {
              $(".start a").html("You Win! Retry?");
              $(".texture").addClass("space");
              $(".link, #story").show();
              Body.setVelocity(spats, { x: 0, y: -4.0 });

              sco = sto.stat.score.toString();
              //Google Analytics
              try {
                gtag("event", sco, { event_category: "win" });
              } catch (e) {
                console.log(e.name);
              }

              reset();
            }
            $("#msg").text("");
          }
          remove(items[parent].id, tick * 0.25);
        }
      } //single or group?
    } //loop
  }, tick * 0.5);

  //Click
  $(document).on("click", ".start, .shots", function (e) {
    var target = e.currentTarget;
    var rect = target.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    $(this)
      .append('<i class="hit" style="left:' + x + "px;top:" + y + 'px;"></i>')
      .delay(400)
      .queue(function (next) {
        $(this).find(".hit").remove();
        next();
      });

    var dir = target.getAttribute("data-dir");
    var shots = dir == "lt" ? [0, 320, 8] : [640, 320, -8];
    fire(shots);
  });

  //Keyboard
  document.body.addEventListener("keydown", function (e) {
    e.preventDefault;
    switch (e.keyCode) {
      case 13: //enter
        $(".start").not(":disabled").trigger("click");
        break;
      case 37: //leftArr
        $(".lt").not(":disabled").trigger("click");
        break;
      case 39: //rightArr
        $(".rt").not(":disabled").trigger("click");
        break;
      case 65: //A
        Body.set(bridgeA.bodies[0], "angularVelocity", 1.25);
        break;
      case 68: //D
        Body.set(bridgeB.bodies[0], "angularVelocity", 1.25);
        break;
      default:
        Body.set(bridgeA.bodies[0], "angularVelocity", 1.25);
        Body.set(bridgeB.bodies[0], "angularVelocity", 1.25);
        break;
    }
  });

  function reset() {
    $("#logo").show();
    $(".start").attr("disabled", false);
    $(".shots").attr("disabled", true);
    clearTimeout(sto.time[0]);
    Runner.stop(runner, engine);
    Render.stop(render);
  }
}; //Example.bridge

function game() {
  $("#logo, .link").hide();
  $(".start").attr("disabled", true);
  $(".shots").attr("disabled", false);
  $(".texture").removeClass("fire space");

  $("#intro").show();

  if ($("canvas").length == 1) {
    $("canvas").remove();
    Example.bridge();
    $(".load").removeClass("load");
  }
}

$(document).bind("touchmove", function (e) {
  e.preventDefault();
});

//Microsoft fallback
var ua = window.navigator.userAgent;

var ua = navigator.userAgent || navigator.vendor || window.opera;

if (
  ua.indexOf("MSIE ") > 0 ||
  ua.indexOf("Trident/") > 0 ||
  ua.indexOf("Edge/") > 0
) {
  document.getElementsByTagName("html")[0].className += " gooMin MS";
}

//reduce quality if < 10 fps
window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.ieRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    }
  );
})();

var fpsElement = document.getElementById("fps");

var then = performance.now() / 1000; // get time in seconds
var render = function () {
  var now = performance.now() / 1000; // get time in seconds

  // compute time since last frame
  var elapsedTime = now - then;
  then = now;

  // compute fps
  var fps = 1 / elapsedTime;
  fpsElement.innerText = fps.toFixed(2);
  if (fps < 5) {
    document.getElementsByTagName("html")[0].className += " gooMin";
  }

  requestAnimFrame(render);
};
render();

window.onbeforeunload = function (event) {
  sco = document.getElementById("score").value;
  //Google Analytics
  try {
    gtag("event", sco, { event_category: "exit" });
  } catch (e) {
    console.log(e.name);
  }
};
