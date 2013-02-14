var objects = {}

function init() {
  createGrid('#main_grid', 10, 10)  
  updatePositions()
}

function updatePositions() {
  // FIXME
  match = /^.+([0-9]+)$/.exec(window.location)

  request = $.ajax('/entities/' + match[1], {dataType: 'json'})
  
  request.done(function(data) {
    $.each(data, function(i,e) {
      var obj = objects[e.id] 

      if (obj == null) {
        objects[e.id] = createObject(e)
      } else {
        // TODO: change object state/text here too?
        moveObject(objects[e.id], e.x, e.y)
      }
    })
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

function createObject(entity_data) {
  var obj = $(document.createElement('div'))
  obj.data('entity-id', entity_data.id)
  obj.addClass(entity_data.type)
  obj.html(entity_data.text)

  obj.draggable({
    addClasses: false,
    containment: $('#main_grid'),
    cursor: 'crosshair',
    // grid: [50, 20]
    // opacity: 0.35
    revert: true, // # 'invalid' / 'valid'
    // snap & snapmode
    stop: function() { },
    
  })
  
  moveObject(obj, entity_data.x, entity_data.y)
  
  return obj
}

function moveObject(obj, nx, ny) {
  var c = cell(nx, ny)
  c.append(obj)
}

function sendMoveRequest(id, nx, ny) {
  request = $.ajax('/move/' + match[1], {
    data: {x: nx, y: ny},
    dataType: 'json'}
  )

  request.done(function(data) {
    moveObject(objects[id], nx, ny)
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

function createGrid(grid_name, width, height) {
  e = $(grid_name)
  e.innerHTML = ''
  
  for(y = 0; y < height; y++) {
    var row = $(document.createElement('div'))
    row.addClass('row')
    
    for(x = 0; x < width; x++) {
    
      var cell = $(document.createElement('div'))
      cell.attr('id', 'grid_' + x + '_' + y)
      cell.addClass('cell')
      row.append(cell)
    }
    e.append(row)
  }

  $(".cell").droppable({
    addClasses: false,
    drop: function(event, ui) {
      var match = /^grid_(\d+)_(\d+)$/.exec(this.id)
      sendMoveRequest(ui.draggable.data('entity-id'), match[1], match[2]) 
    },
    hoverClass: 'drop-hover'
  })
}


function cell(x, y) {
  return $('#grid_'+x+'_'+y)
}