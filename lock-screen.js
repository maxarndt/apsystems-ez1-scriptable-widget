// URL of the getOutputData endpoint of APsystems EZ1-M local API
const url = "http://192.168.178.58:8050/getOutputData";
// max. configured output power of APsystems EZ1-M
const maxPower = 800;

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();

async function createWidget() {
  const listwidget = new ListWidget();

  const power = await getCurrentPower();
  const powerPercentage = power ? power / maxPower * 100 : 0;
  const powerLabel = power ? `${power} W` : "err";

  const diagramStack = listwidget.addStack();
  diagramStack.layoutHorizontally();
  diagramStack.addImage(getDiagram(powerPercentage, powerLabel));

  return listwidget;
}

async function getCurrentPower() {
  let power;

  try {
    const request = new Request(url, {signal: AbortSignal.timeout(3000)});
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
  const canvSize = 200
  const canvTextSize = 40
  
  const canvWidth = 20
  const canvRadius = 90
  
  canvas.opaque = false;
  canvas.size = new Size(canvSize, canvSize);
  canvas.respectScreenScale = true;
  
  drawArc(
    new Point(canvSize / 2, canvSize / 2),
    canvRadius,
    canvWidth,
    Math.floor(percentage * 3.6),
    Color.white()
  );

  const canvTextRect = new Rect(
    0,
    100 - canvTextSize / 2,
    canvSize,
    canvTextSize * 1.4 // X-height "* 1.4" so e.g. commas aren't cut off
  );
  canvas.setTextAlignedCenter();
  canvas.setTextColor(Color.white());
  canvas.setFont(Font.semiboldSystemFont(canvTextSize));
  canvas.drawTextInRect(label, canvTextRect);

  return canvas.getImage();
}
