var element = document.getElementById("text");
var zerohit = true;
function move() {
  var rect = element.getBoundingClientRect();
  var left = rect.left;
  console.log(window.innerWidth);
  if (left <= 0) {
    zerohit = true;
  }
  if (left + 260 >= window.innerWidth) {
    zerohit = false;
  }
  if (zerohit) {
    left += 10;
  } else {
    left -= 10;
  }
  console.log("left: " + left);
  element.style.left = left + "px";
}

setInterval(move, 100);
