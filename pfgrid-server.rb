require 'sinatra'
require 'sinatra/reloader' if development?
require 'dm-core'
require 'dm-migrations'
require 'json'

DataMapper.setup( :default, "sqlite3://#{Dir.pwd}/pfgrid.db" )

class Board
	include DataMapper::Resource

	property :id, Serial
	property :name, String
	property :created_at, DateTime

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
end

def entity_to_hash e
	{:id => e.id, :name => e.name, :image => e.image, :type => e.type, :x => e.x, :y => e.y}
end

get '/' do
  @boards = Board.all
  erb :index
end

get '/create/:name' do |n|
	halt 'invalid name' if n !~ /^[a-zA-Z ]/

	b = Board.create(:name => n, :created_at => Time.now)
	redirect to('/')
end

get '/board/:id' do
	# @board_id = params[:id]
	erb :show
end

get '/entities/list/:board' do |board|
	entities = Board.get!(board).entities	
	entities.map { |e| entity_to_hash(e) }.to_json
end

get '/entities/add/:board' do |board|
	b = Board.get!(board)
	e = Entity.create(:name => params[:name], :image => "/images/#{%w(archer cultist).sample}.png", :type => %w(friendly hostile).sample, :x => 1, :y => 1)
	b.entities << e
	b.save

	entity_to_hash(e).to_json
end

get '/move/:entity' do |entity_id|
	e = Entity.get!(entity_id)
	e.x = params[:x]
	e.y = params[:y]
	e.save

	'true'
end

b = Board.new(:name => 'Party Setup', :created_at => Time.now)
b.entities << Entity.create(:name => 'Ferra', :image => '/images/archer.png', :type => 'friendly', :x => 3, :y => 1)
b.entities << Entity.create(:name => 'Elena', :image => '/images/witch.png', :type => 'friendly', :x => 2, :y => 1)
b.entities << Entity.create(:name => 'Miguel', :image => '/images/bard.png', :type => 'friendly', :x => 3, :y => 2)
b.entities << Entity.create(:name => 'Bash', :image => '/images/knight.png', :type => 'friendly', :x => 3, :y => 3)
b.entities << Entity.create(:name => 'Hammerson', :image => '/images/wizard.png', :type => 'friendly', :x => 2, :y => 2)

b.entities << Entity.create(:name => 'Goblin 1', :image => '/images/goblin.png', :type => 'hostile', :x => 6, :y => 7)
b.entities << Entity.create(:name => 'Goblin 2', :image => '/images/goblin.png', :type => 'hostile', :x => 6, :y => 8)
b.save
