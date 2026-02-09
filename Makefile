install:
	cd frontend && npm i
	cd backend && npm i

dev:
	cd backend && npm run dev & cd frontend && npm run dev

dev-frontend:
	cd frontend && npm run dev

dev-backend:
	cd backend && npm run dev

build:
	cd frontend && npm run build
	cd backend && npm run build

clean:
	rm -rf frontend/node_modules frontend/.next backend/node_modules backend/dist
