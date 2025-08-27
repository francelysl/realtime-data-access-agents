.PHONY: be fe dev

be:
	cd backend && uvicorn app.main:app \
		--reload \
		--reload-dir app \
		--reload-exclude "../.venv/*" \
		--port 8000

fe:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	@concurrently -k "make be" "make fe"
