// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
// URL of the getOutputData endpoint of APsystems EZ1-M local API
const url = "http://192.168.178.58:8050/getOutputData";
// max. configured output power of APsystems EZ1-M
const maxPower = 800;

const thresholds = {  
  orange: 24,
  green: 74
};

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();

async function createWidget() {
  const listwidget = new ListWidget();

  const heading = listwidget.addText("☀️ Balkon");
  heading.centerAlignText();
  heading.font = Font.lightSystemFont(20);

  const power = await getCurrentPower();
  const powerPercentage = power ? power / maxPower * 100 : 0;
  const powerLabel = power ? `${power} W` : "error";

  listwidget.addSpacer(5);

  const diagramStack = listwidget.addStack();
  diagramStack.addSpacer();
  diagramStack.addImage(getDiagram(powerPercentage, powerLabel));
  diagramStack.addSpacer();

  return listwidget;
}

async function getCurrentPower() {
  let power;

  try {
    const request = new Request(url);
    request.timeoutInterval = 5;
    const response = await request.loadJSON();
    power = response.data?.p1 + response.data?.p2;
  } catch (error) {
    console.log(error);
    power = undefined;
  }

  return power;
}

function getDiagram(percentage, label) {
  function drawArc(ctr, rad, w, deg, color) {
    const bgx = ctr.x - rad;
    const bgy = ctr.y - rad;
    const bgd = 2 * rad;
    const bgr = new Rect(bgx, bgy, bgd, bgd);
  
    canvas.setFillColor(color);
    canvas.setStrokeColor(Color.gray());
    canvas.setLineWidth(w);
    canvas.strokeEllipse(bgr);
  
    for (t = 0; t < deg; t++) {
      const rect_x = ctr.x + rad * sinDeg(t) - w / 2;
      const rect_y = ctr.y - rad * cosDeg(t) - w / 2;
      const rect_r = new Rect(rect_x, rect_y, w, w);
      canvas.fillEllipse(rect_r);
    }
  }
  function sinDeg(deg) {
    return Math.sin((deg * Math.PI) / 180);
  }
  
  function cosDeg(deg) {
    return Math.cos((deg * Math.PI) / 180);
  }
  const canvas = new DrawContext();
  const canvSize = 200;
  const canvTextSize = 30;
  
  const canvWidth = 15;
  const canvRadius = 85;
  
  canvas.opaque = false;
  canvas.size = new Size(canvSize, canvSize);
  canvas.respectScreenScale = true;
  
  let color;
  if (percentage > thresholds.green) {
    color = Color.green();
  } else if (percentage > thresholds.orange) {
    color = Color.orange();
  } else {
    color = Color.red();
  }
  drawArc(
    new Point(canvSize / 2, canvSize / 2),
    canvRadius,
    canvWidth,
    Math.floor(percentage * 3.6),
    color
  );

  const canvTextRect = new Rect(
    0,
    100 - canvTextSize / 2,
    canvSize,
    canvTextSize * 1.4 // X-height "* 1.4" so e.g. commas aren't cut off
  );
  canvas.setTextAlignedCenter();
  canvas.setTextColor(Color.gray());
  canvas.setFont(Font.boldSystemFont(canvTextSize));
  canvas.drawTextInRect(label, canvTextRect);

  return canvas.getImage();
}
