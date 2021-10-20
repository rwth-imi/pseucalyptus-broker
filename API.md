# PseucalyptusBrokerAPI
## Endpoints
### Transactions
POST /transactions
GET /transactions/{id}
DELETE /transactions/{id}

### Processes
POST /transactions/{id}/processes
GET /transactions/{id}/processes
GET /processes
GET /processes/{id}
PATCH /processes/{id}

### Files
POST /processes/{id}/files

### Clients
POST /clients
GET /clients
GET /clients/{id}
DELETE /clients/{id}

### Capabilities
POST /clients/{id}/capabilities
DELETE /clients/{id}/capabilities/{id}
GET /clients/{id}/capabilities
GET /clients/{id}/capabilities/{id}

## Models
### Transaction
* id: uuid
* created-at: timestamp
* created-by: Client
* processes: Process[]

### Process
* id: uuid
* transaction: Transaction
* created-at: timestamp
* created-by: Capability
* capability: Capability
* status: Enum[created,submitted,planned,queued,processing,interaction,failed,rejected,completed]
* files: File[]

### Client
* id: uuid
* name: string
* authenticationInfo: any
* capabilities: Capability[]
* processes: Process[]

### FilePattern
* id: uuid
* name: string
* type: string

### File
* id: uuid
* pattern: FilePattern 
* hash: string

### Capability
* id: uuid
* client: Client
* name: string
* needs: FilePattern[]
* triggers: Capability[]

## Filetree
```
.
├── clients
│   └── clientA
│       └── capabilities
│           └── capabilityA
│               ├── needs
│               │   └── fileA
│               ├── processes
│               │   └── processA -> ../../../../../transactions/transactionA/processes/processA
│               └── triggers
│                   └── capabilityZ -> ../../../clientB/capabilities/capabilityZ
└── transactions
    └── transactionA
        ├── created-at
        ├── created-by -> ../../clients/clientA
        └── processes
            └── processA
                ├── capability -> ../../../../clients/clientA/capabilities/capabilityA
                ├── created-at
                ├── created-by -> ../../../../clients/clientA/capabilities/capabilityA
                ├── files
                │   └── fileA
                └── status
```

## Example
### c1 (sender) initial
#### c1 (sender) creates transaction
POST /transaction
client-id: c1
```
{}
```
```
{
	id: t1,
	created-at: 2012-03-04 05:06:07+02:00,
	created-by: c1,
	processes: []
}
```

#### c1 (sender) creates process in transaction t1 for client c2 (id-management)
POST /transaction/t1/processes
client-id: c1
```
{
	capability: {
		client: c2,
		process: someIDATmagic
	}
}
```
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: created,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: null
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: null
		}
	]
}
```

#### c1 (sender) uploads requested files IDAT and MDAT
POST /files/f1
client-id: c1
hash: *optional hashsum to check against*
```
patientA
patientB
patientC
```
```
{
	id: f1,
	pattern: {
		name: IDAT,
		type: text/csv
	},
	hash: h1
}
```

POST /files/f2
client-id: c1
hash: *optional hashsum to check against*
```
BLOB
```
```
{
	id: f2,
	pattern: {
		name: MDAT,
		type: application/octet-stream
	},
	hash: h2
}
```

PATCH /processes/p1
client-id: c1
```
{
	status: submitted
}
```
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: submitted,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h1
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h2
		}
	]
}
```
--> set status to "planned" and notify c2
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: planned,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h1
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h2
		}
	]
}
```

### c2 (id-management) someIDATmagic

#### c2 (id-management) sets status of p1 to queued
PATCH /processes/p1
client-id: c2
```
{
	status: queued
}
```
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: queued,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h1
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h2
		}
	]
}
```

#### c2 (id-management) is ready to process p1 and sets status accordingly
PATCH /processes/p1
client-id: c2
```
{
	status: processing
}
```
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: processing,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h1
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h2
		}
	]
}
```

#### c2 (id-management) requests files
GET /files/f1
client-id: c2
```
patientA
patientB
patientC
```

GET /files/f2
client-id: c2
```
BLOB
```

#### c2 (id-management) successfully processed files and sends the results to c3 (monitoring)
POST /transaction/t1/processes
client-id: c1
```
{
	capability: {
		client: c3,
		process: monitoring
	}
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		process: monitoring
	},
	status: created,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: null
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: null
		}
	]
}
```

POST /files/f3
client-id: c2
hash: *optional hashsum to check against*
```
psnA
psnB
psnC
```
```
{
	id: f3,
	pattern: {
		name: PSN,
		type: text/csv
	},
	hash: h3
}
```

POST /files/f4
client-id: c2
hash: *optional hashsum to check against*
```
BLOB
```
```
{
	id: f4,
	pattern: {
		name: MDAT,
		type: application/octet-stream
	},
	hash: h4
}
```

PATCH /processes/p2
client-id: c2
```
{
	status: submitted
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		process: monitoring
	},
	status: submitted,
	files: [
		{
			id: f3,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```
--> set status to "planned" and notify c3
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		process: monitoring
	},
	status: planned,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

#### c2 (id-management) sets p1 to status completed
PATCH /processes/p1
client-id: c2
```
{
	status: completed
}
```
```
{
	id: p1,
	transaction: t1,
	created-at: 2012-03-04 05:06:08+02:00,
	created-by: c1,
	capability: {
		client: c2,
		process: someIDATmagic
	},
	status: completed,
	files: [
		{
			id: f1,
			pattern: {
				name: IDAT
				type: text/csv
			},
			hash: h1
		},
		{
			id: f2,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h2
		}
	]
}
```

### c3 (monitoring) monitoring

#### c3 (monitoring) sets status of p2 to queued
PATCH /processes/p2
client-id: c3
```
{
	status: queued
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		name: monitoring
	},
	status: queued,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

#### c3 (monitoring) is ready to process p2 and sets status accordingly
PATCH /processes/p2
client-id: c3
```
{
	status: processing
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		name: monitoring
	},
	status: processing,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

#### c3 (monitoring) requests files
GET /files/f3
client-id: c3
```
psnA
psnB
psnC
```

GET /files/f4
client-id: c3
```
BLOB
```

#### c3 (monitoring) needs some human interaction
POST /processes/p2
client-id: c3
```
{
	status: interaction
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		name: monitoring
	},
	status: interaction,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

#### c3 (monitoring) continues processing
POST /processes/p2
client-id: c3
```
{
	status: processing
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		name: monitoring
	},
	status: processing,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

#### c3 (monitoring) successfully processed files and sends the results to c1 (sender)
POST /transaction/t1/processes
client-id: c3
```
{
	capability: {
		client: c1,
		name: hints
	}
}
```
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: created,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: null
		}
	]
}
```

POST /files/f5
client-id: c3
hash: *optional hashsum to check against*
```
Some useful hint, maybe
```
```
{
	id: f5,
	pattern: {
		name: HINTS,
		type: text/plain
	},
	hash: h5
}
```

PATCH /processes/p3
client-id: c2
```
{
	status: submitted
}
```
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: submitted,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: h5
		}
	]
}
```
--> set status to "planned" and notify c1
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: planned,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: h5
		}
	]
}
```

#### c3 (monitoring) sets p2 to status completed
POST /processes/p2
client-id: c3
```
{
	status: completed
}
```
```
{
	id: p2,
	transaction: t1,
	created-at: 2012-03-04 05:06:09+02:00,
	created-by: c2,
	capability: {
		client: c3,
		name: monitoring
	},
	status: completed,
	files: [
		{
			id: f3,
			pattern: {
				name: PSN
				type: text/csv
			},
			hash: h3
		},
		{
			id: f4,
			pattern: {
				name: MDAT
				type: application/octet-stream
			},
			hash: h4
		}
	]
}
```

### c1 (sender) hints

#### c1 (sender) sets status of p3 to queued
PATCH /processes/p3
client-id: c1
```
{
	status: queued
}
```
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: queued,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: h5
		}
	]
}
```

#### c1 (sender) is ready to process p3 and sets status accordingly
PATCH /processes/p3
client-id: c1
```
{
	status: processing
}
```
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: processing,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: h5
		}
	]
}
```

#### c1 (sender) requests files
GET /files/f5
client-id: c1
```
Some useful hint, maybe
```

#### c1 (sender) sets p3 completed
PATCH /processes/p3
client-id: c1
```
{
	status: completed
}
```
```
{
	id: p3,
	transaction: t1,
	created-at: 2012-03-04 05:06:10+02:00,
	created-by: c3,
	capability: {
		client: c1,
		name: hints
	},
	status: completed,
	files: [
		{
			id: f5,
			pattern: {
				name: HINTS
				type: text/plain
			},
			hash: h5
		}
	]
}
```

#### c1 (sender) deletes transaction t1
DELETE /transaction/t1
--> OK
