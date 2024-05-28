ifneq (,$(wildcard ./config/.env))
    include ./config/.env
    export
endif

cmd-exists-%:
	@hash $(*) > /dev/null 2>&1 || \
		(echo "ERROR: '$(*)' must be installed and available on your PATH."; exit 1)

help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/[:].*[##]/:/'

# build-api: ## Compile the api and output as per tsconfig.json
# 	@cd ./abods-api; npm run build

# run-api-local: ## Run the express api locally using sam, with rebuild on change
# 	@cd ./abods-api; npm run start:dev

# deploy-api-%: ## Deploy the api to the target environment using sam
# 	@cd ./abods-api; sam deploy --config-env=$(*) --confirm-changeset --resolve-s3