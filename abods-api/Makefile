.PHONY: build-lambda-common clean copy-build-artefacts 
.PHONY: build-GraphQlFunction build-RuntimeDependenciesLayer

GRAPHQL_SCHEMA=schema.graphql
SRC_DIR=$(PWD)/src

cmd-exists-%:
	@hash $(*) > /dev/null 2>&1 || \
		(echo "ERROR: '$(*)' must be installed and available on your PATH."; exit 1)

build-GraphQlFunction:
	$(MAKE) HANDLER=src/index.ts build-lambda-common
	$(MAKE) copy-build-artefacts

build-RuntimeDependenciesLayer: cmd-exists-npm
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install --prefix "$(ARTIFACTS_DIR)/nodejs/"
	rm -rf "$(ARTIFACTS_DIR)/nodejs/node_modules/.prisma"
	rm "$(ARTIFACTS_DIR)/nodejs/package.json"

build-lambda-common: cmd-exists-npm
	npm install --omit=dev
	rm -rf dist
	printf "{\"extends\": \"./tsconfig.json\", \"include\": [\"${HANDLER}\"] }" > tsconfig-only-handler.json
	npm run build -- --build tsconfig-only-handler.json

copy-build-artefacts:
	cp -r dist "$(ARTIFACTS_DIR)/"
	cp -r node_modules "$(ARTIFACTS_DIR)/"
	cp -r prisma "$(ARTIFACTS_DIR)/"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/"
	mkdir -p "$(ARTIFACTS_DIR)/$$(dirname $(GRAPHQL_SCHEMA))"
	cp "$(PWD)/$(GRAPHQL_SCHEMA)" "$(ARTIFACTS_DIR)/$(GRAPHQL_SCHEMA)"
	# @find $(SRC_DIR) -type f ! -name '*.ts' -print0 | \
	# 	while IFS= read -r -d '' file; do \
	# 		dest_file=$(ARTIFACTS_DIR)/src/$${file#$(SRC_DIR)/}; \
	# 		mkdir -p "$$(dirname "$$dest_file")"; \
	# 		cp "$$file" "$$dest_file"; \
	# 	done

clean:
	rm -rf .aws-sam
	rm -rf dist
	rm -rf node_modules