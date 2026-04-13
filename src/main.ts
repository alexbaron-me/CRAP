import { config } from 'dotenv'

async function main() {
	config()

	console.log(process.env.CLAUDE_API_KEY)
}

main()
