import * as cache from 'cache';

export default function reset () {
	Object.values(cache).forEach(cachedValue => {
		Object.keys(cachedValue).forEach(key => delete cachedValue[key]);
	});
}
