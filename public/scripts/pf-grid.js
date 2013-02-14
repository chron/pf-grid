var objects = {}

function init() {
  createGrid('#main_grid', 10, 10)  
  updatePositions()
}

function boardId() {
  match = /^.+([0-9]+)$/.exec(window.location)
  return match[1]
}

function updatePositions() {
  request = $.ajax('/entities/list/' + boardId(), {dataType: 'json'})
  
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

  //setTimeout('updatePositions()', 5000)
}

function createObject(entity_data) {
  var obj = $(document.createElement('div'))
  obj.data('entity-id', entity_data.id)
  obj.addClass(entity_data.type)
  
  var sprite = $(document.createElement('img'))
  sprite.attr('src', entity_data.image)
  obj.append(sprite)

  //obj.html('A') //entity_data.name)

  obj.draggable({
    addClasses: false,
    //containment: $('#main_grid'),
    cursor: 'hand',
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

function sendCreateRequest(name) {
  request = $.ajax('/entities/add/' + boardId(), {
    data: {name: name},
    dataType: 'json'}
  )

  request.done(function(data) {
    createObject(data)
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

function sendMoveRequest(id, nx, ny) {
  request = $.ajax('/move/' + id, {
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
      var match = /^grid_(-?\d+)_(-?\d+)$/.exec(this.id)
      sendMoveRequest(ui.draggable.data('entity-id'), match[1], match[2]) 
    },
    hoverClass: 'drop-hover'
  })
}


function cell(x, y) {
  return $('#grid_'+x+'_'+y)
}