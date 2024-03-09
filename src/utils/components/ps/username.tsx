export function Username ({ name }: { name: string }): React.ReactElement {
	// @ts-expect-error -- Custom PS element
	return <username>{name}</username>;
}
