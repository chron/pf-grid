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
	property :text, String
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

get '/' do
  @boards = Board.all
  erb :index
end

get '/create/:name' do |n|
	halt 'invalid name' if n !~ /^[a-zA-Z ]/

	b = Board.new(:name => n, :created_at => Time.now)
	b.entities << Entity.create(:text => ?A, :type => 'friendly', :x => rand(10), :y => rand(10))
	b.save
	redirect to('/')
end

get '/show/:id' do
	# @board_id = params[:id]
	erb :show
end

get '/entities/:board' do
	entities = Board.get!(params[:board].to_i).entities	
	entities.map { |e| {:id => e.id, :text => e.text, :type => e.type, :x => e.x, :y => e.y}}.to_json
end

get '/move/:entity' do |entity_id|
	e = Entity.get!(entity_id)
	e.x = params[:x]
	e.y = params[:y]
	e.save

	'true'
end