var EXTENSION_ID = chrome.i18n.getMessage("@@extension_id");
var BLOCKED_CLASS_NAME = EXTENSION_ID + "-blocked";

var blocked = false;
var overlay, controls;

// Phases.trigger requires API permissions that we don't have, so, when the
// controls try to trigger, have them send the router a message instead.
Phases.trigger = function(action) {
  chrome.runtime.sendMessage({trigger: action});
}

function buildOverlay() {
  var overlay = document.createElement("div");
  overlay.id = EXTENSION_ID + "-overlay";
  var messageKeys = ["site_blocked_info", "site_blocked_motivator"];
  messageKeys.forEach(function(key) {
    var p = document.createElement("p");
    p.innerText = chrome.i18n.getMessage(key);
    overlay.appendChild(p);
  });
  return overlay;
}

function block() {
  console.log("Blocked.");
  blocked = true;
  document.documentElement.classList.add(BLOCKED_CLASS_NAME);
  if (!overlay) {
    overlay = buildOverlay();
  }
  document.body.appendChild(overlay);
}

function unblock() {
  console.log("Unblocked.");
  blocked = false;
  document.documentElement.classList.remove(BLOCKED_CLASS_NAME);
  document.body.removeChild(overlay);
}

function updateOverlay(phase) {
  if (blocked) {
    console.log("OMG we're blocked! Update overlay!", phase, phase.on.next);
    if (controls) overlay.removeChild(controls);
    controls = Controls.build(phase);
    overlay.appendChild(controls);
  }
}

function toggleBlocked(phase) {
  console.log("Current phase:", phase);
  if (phase.blocked !== blocked) {
    // TODO: forward matcher with phase changes to avoid redundant lookups?
    SiteMatcher.getCurrent(function(matcher) {
      if (!matcher.allows(document.location.href)) {
        if (phase.blocked) {
          block();
        } else {
          unblock();
        }
      }
      updateOverlay(phase);
    });
  } else {
    updateOverlay(phase);
  }
}

Phases.onChanged.addListener(function(phaseName) {
  toggleBlocked(Phases.get(phaseName));
});

Phases.getCurrent(toggleBlocked);
