BattleGrid = function(element_ref, width, height) {
  self = this
  self.element_ref = element_ref
  self.width = width
  self.height = height
  self.objects = {}

  match = /^.+([0-9]+)$/.exec(window.location)
  self.boardId = match[1]

  self.createGrid()
  self.updatePositions()
}

BattleGrid.prototype.updatePositions = function() {
  request = $.ajax('/entities/list/' + self.boardId, {dataType: 'json'})
  
  request.done(function(data) {
    $.each(data, function(i,e) {
      var obj = self.objects[e.id] 

      if (obj == null) {
        self.createObject(e)
      } else {
        self.moveObject(self.objects[e.id], e.x, e.y)
      }
    })

    setTimeout('self.updatePositions()', 3000)
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

BattleGrid.prototype.createObject = function(entity_data) {
  var obj = $(document.createElement('div'))
  obj.data('entity-id', entity_data.id)
  obj.addClass(entity_data.type)
  
  //var sprite = $(document.createElement('img'))
  //sprite.attr('src', entity_data.image)
  //obj.append(sprite)

  var objName = entity_data.name.substring(0,1)
  var match = /(\d+)$/.exec(entity_data.name)

  if (match != null) {
    objName += '<sup>' + match[1] + '</sup>'
  }

  obj.html(objName)

  obj.draggable({
    addClasses: false,
    //containment: $('#main_grid'),
    cursor: 'pointer',
    //grid: [21, 21], // would be cool but need to change on page zoom
    // opacity: 0.35
    revert: 'invalid',
    //revertDuration: 0,
    // snap & snapmode
  })
  
  //$('.holding_cell').append(obj)
  self.moveObject(obj, entity_data.x, entity_data.y)
  
  self.objects[entity_data.id] = obj

  return obj
}

BattleGrid.prototype.deleteObject = function(id) {
  self.objects[id].remove()
  delete self.objects[id]
}

BattleGrid.prototype.moveObject = function(obj, nx, ny) {
  var newParentCell = self.cell(nx, ny)

  obj.css("left", '')
  obj.css("top", '')

  newParentCell.append(obj)
}

BattleGrid.prototype.sendCreateRequest = function(name, type) {
  if (name == '') {
    alert("No name?")
    return false
  }

  request = $.ajax('/entities/add/' + self.boardId, {
    data: {name: name, type: type},
    dataType: 'json'}
  )

  request.done(function(data) {
    self.createObject(data)
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

BattleGrid.prototype.sendDeleteRequest = function(id) {
  request = $.ajax('/entities/delete/' + id, {
    dataType: 'json'}
  )

  request.done(function(returnValue) {
    if (returnValue) {
      self.deleteObject(id)
    }
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

BattleGrid.prototype.sendMoveRequest = function(id, nx, ny) {
  request = $.ajax('/move/' + id, {
    data: {x: nx, y: ny},
    dataType: 'json'}
  )

  request.done(function(returnValue) {
    if (returnValue) {
      self.moveObject(self.objects[id], nx, ny)
    }
  })
  
  request.fail(function(jqXHR, textStatus) {
    alert( "Request failed: " + textStatus );
  });
}

BattleGrid.prototype.createGrid = function() {
  e = $(self.element_ref)
  e.innerHTML = ''
  
  for(y = 0; y < self.height; y++) {
    var row = $(document.createElement('div'))
    row.addClass('row')
    
    for(x = 0; x < self.width; x++) {
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
      self.sendMoveRequest(ui.draggable.data('entity-id'), match[1], match[2])
    },
    hoverClass: 'drop-hover'
  })

$("#trash").droppable({
    addClasses: false,
    drop: function(event, ui) {
      var match = /^grid_(-?\d+)_(-?\d+)$/.exec(this.id)
      self.sendDeleteRequest(ui.draggable.data('entity-id'))
    },
    hoverClass: 'drop-hover'
  })
}

BattleGrid.prototype.cell = function(x, y) {
  return $('#grid_'+x+'_'+y)
}