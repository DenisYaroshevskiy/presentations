function addSection(parent) {
  let section = document.createElement('section');
  parent.appendChild(section);
  return section;
}


function addTitle(section, text) {
  let element = document.createElement('h3');
  let textNode = document.createTextNode(text);
  element.appendChild(textNode);
  section.appendChild(element);
  return element;
}

async function loadStaticData() {
  if (!loadStaticData.cache) {
    let loaded = await loadMeasurements();
    loaded = loaded.map((v) => {
           if (v.group == 'intel_9700K_avx2_bmi'  ) v.group = 'avx2+bmi';
      else if (v.group == 'intel_9700K_avx2'      ) v.group = 'avx2';
      else if (v.group == 'intel_9700K_sse2'      ) v.group = 'sse2';
      else if (v.group == 'intel_9700K_sse4_2'    ) v.group = 'sse4.2';
      return v;
    });
    let byKeys = valuesByKeys(loaded);
    loadStaticData.cache = [loaded, byKeys];
  }
  return loadStaticData.cache;
}

async function thisPresentationDraw(elementID, selection_, filter_, offByDefault) {
  const element = document.getElementById(elementID);
  const [measurements, byKeys] = await loadStaticData();

  let selection = JSON.stringify(selection_, undefined, 2);
  let filter = JSON.stringify(filter_, undefined, 2);
  const [varying, fixed] = inputParse(selection, byKeys);
  const traceFilter = filterParse(filter);
  const asVisualized = visualizationDataFromMeasurements(varying, fixed, measurements);

  drawBenchmark(element, 1000, asVisualized, traceFilter, offByDefault);
}

function addBenchmarkForParameters(slide_id, title, parameters, filter, offByDefault = []) {
  let main = document.getElementById(slide_id);
  let section = addSection(main);
  addTitle(section, title);
  let div = document.createElement('div');
  const id = slide_id + '_' + JSON.stringify(parameters);
  div.setAttribute('id', id);
  section.appendChild(div);
  thisPresentationDraw(id, parameters, filter, offByDefault);
}

function addBenchmarkForSize(slide_id, title, size, parameters, filter, offByDefault = []) {
  title += ' (' + size.toString() + ' bytes)';

  let parameters_copy = JSON.parse(JSON.stringify(parameters));

  parameters_copy.size = size;
  addBenchmarkForParameters(slide_id, title, parameters_copy, filter, offByDefault);
}

function addBenchmarkForType(slide_id, title, type, parameters, filter, offByDefault = []) {
  title += ' (' + type + ')';

  let parameters_copy = JSON.parse(JSON.stringify(parameters));

  parameters_copy.type = type;
  addBenchmarkForParameters(slide_id, title, parameters_copy, filter, offByDefault);
}

function allSizesBenchmark(slide_id, title, parameters, filter) {
  for (let size of [40, 1000, 10000]) {
    addBenchmarkForSize(slide_id, title, size, parameters, filter);
  }
}

function allTypesBenchmark(slide_id, title, parameters, filter) {
  for (let type of ['char', 'short', 'int']) {
    addBenchmarkForType(slide_id, title, type, parameters, filter);
  }
}

function addImg(parent, img_path) {
  let img = document.createElement('img');
  img.src = img_path;
  parent.appendChild(img);
  return img;
}

function imagesSlideShow(id, img_count) {
  let main = document.getElementById(id);
  for (let i = 0; i != img_count; ++i) {
    let section = addSection(main);
    const img_path = '../img/' + id + '/img' + i.toString() + '.png';
    console.log(img_path);
    addImg(section, img_path);
  }
}
