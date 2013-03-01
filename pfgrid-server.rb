require 'json'
require 'sinatra'
require 'sinatra/reloader' if development?
require 'dm-core'
require 'dm-migrations'
require 'dm-aggregates'
require 'pg'

DataMapper.setup(:default, ENV['DATABASE_URL'] || "postgres://pfgrid:test@localhost:5432/pfgrid")

class Board
	include DataMapper::Resource

	property :id, Serial
	property :name, String
	property :width, Integer, :default => 15
	property :height, Integer, :default => 15
	property :created_at, DateTime
	property :last_move, DateTime

	has n, :entities
end

class Entity
	include DataMapper::Resource

	property :id, Serial
	property :name, String
	property :image, String
	property :type, String
	property :x, Integer
	property :y, Integer

	belongs_to :board
end

DataMapper.auto_migrate!
DataMapper.finalize

configure do
  mime_type :css, 'text/css'
  #static_cache_control 
end

get '/' do
  @boards = Board.all(:order => :last_move.desc)
  erb :index
end

get '/create/:name' do |n|
	b = Board.create(:name => n, :created_at => Time.now, :last_move => Time.now)
	b.attributes.to_json
end

get '/board/:id' do |id|
	@board = Board.get(id)

	erb :show
end

get '/entities/list/:board' do |board|
	board = Board.get!(board)
	last_modified board.last_move
	board.entities.map { |e| e.attributes }.to_json
end

get '/entities/add/:board' do |board|
	b = Board.get!(board)
	e = Entity.create(:name => params[:name], :type => params[:type], :x => -1, :y => -1)
	b.last_move = Time.now
	b.entities << e
	b.save

	e.attributes.to_json
end

get '/entities/delete/:id' do |id|
	e = Entity.get!(id.to_i)
	e.board.last_move = Time.now
	e.board.save
	e.destroy.to_s
end

get '/move/:entity' do |entity_id|
	nx, ny = params[:x], params[:y]
	e = Entity.get(entity_id)

	rval = if e && ((nx == -1 && ny == -1) || Entity.count(:x => nx, :y => ny) == 0)
		e.x = nx
		e.y = ny
		e.board.last_move = Time.now
		e.save
	end

	rval.to_json
end

b = Board.new(:name => 'Demonstration', :created_at => Time.now, :last_move => Time.now)
b.entities << Entity.create(:name => 'Ferra', :image => '/images/archer.png', :type => 'friendly', :x => 3, :y => 1)
b.entities << Entity.create(:name => 'Elena', :image => '/images/witch.png', :type => 'friendly', :x => 2, :y => 1)
b.entities << Entity.create(:name => 'Miguel', :image => '/images/bard.png', :type => 'friendly', :x => 3, :y => 2)
b.entities << Entity.create(:name => 'Bash', :image => '/images/knight.png', :type => 'friendly', :x => 3, :y => 3)
b.entities << Entity.create(:name => 'Hammerson', :image => '/images/wizard.png', :type => 'friendly', :x => 2, :y => 2)

b.entities << Entity.create(:name => 'Goblin 1', :image => '/images/goblin.png', :type => 'hostile', :x => 6, :y => 7)
b.entities << Entity.create(:name => 'Goblin 2', :image => '/images/goblin.png', :type => 'hostile', :x => 6, :y => 8)
b.save
