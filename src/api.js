import config from './config';
import fs from 'fs';

class Api {

	async getProfile (username) {
		let data = await this.fetchApi(config.GRAPHQL_URL.checkProfile(username), 'GET');
		return data;
	}

	async following ({ username, limit }, nextCursor = '') {
		if (!nextCursor) {
			let { graphql: { user } } = await this.getProfile(username);
			this.userId = user.id;
		}

		let { data } = await this.fetchApi(config.GRAPHQL_URL.fetchFollowing(this.userId, nextCursor));
		let { count, page_info: { has_next_page, end_cursor }, edges } = data.user.edge_follow;
		edges.map(v => {
			this.followingList.data.push({
				idUser: v.node.id,
				username: v.node.username,
				is_private: v.node.is_private,
			});
		});

		let hasLimit = limit || count;

		if (has_next_page && this.followingList.data.length < hasLimit) {
			let nextPage = `%2C%22after%22%3A%22${end_cursor.slice(0, end_cursor.length - 2)}%3D%3D%22`;
			await this.following({ username, limit }, nextPage);
		}

		this.followingList.total = count;
		return this.followingList;
	}

	async getTimelineStory () {
		let { data } = await this.fetchApi(config.GRAPHQL_URL.storyTimeline, 'GET');
		return data.user.feed_reels_tray.edge_reels_tray_to_reel.edges.map(v => {
			return {
				isUserHasView: v.node.seen === v.node.latest_reel_media || v.node.seen > v.node.latest_reel_media,
				username: v.node.user.username,
			};
		});
	}

	async getTimeLineFeed () {
		let { data } = await this.fetchApi(config.GRAPHQL_URL.timelineFeed, 'GET');
		let { edges } = data.user.edge_web_feed_timeline;
		return edges;
	}

	async getMediaByUsername (username, countImage = 2) {
		let { graphql: { user } } = await this.fetchApi(config.GRAPHQL_URL.checkProfile(username), 'GET');
		let {
			edges: nodes,
			page_info,
		} = user.edge_owner_to_timeline_media;
		for (let i = 0; i < nodes.length; i++) {
			this.mediaImage.push({
				id: nodes[i].node.id,
				code: (!nodes[i].node.comments_disabled) ? nodes[i].node.shortcode : null,
				src: nodes[i].node.display_url,
				comments_disabled: nodes[i].node.comments_disabled,
			});
		}
		let data = await this._pageMediaByUserName(page_info.end_cursor, user, Math.floor(countImage / 12) - 1);
		return data.slice(0, countImage);
	}

	async _pageMediaByUserName (nextCursor, idUser, countImage) {
		if (nextCursor) {
			let response = await this.fetchApi(config.GRAPHQL_URL.pagingMedia(idUser.id, nextCursor));
			let {
				page_info,
				edges,
			} = response.data.user.edge_owner_to_timeline_media;
			for (let i = 0; i < edges.length; i++) {
				this.mediaImage.push({
					id: edges[i].node.id,
					code: (!edges[i].node.comments_disabled) ? edges[i].node.shortcode : null,
					src: edges[i].node.display_url,
					comments_disabled: edges[i].node.comments_disabled,
				});
			}

			if (countImage < 1) {
				return this.mediaImage;
			}

			if (page_info.has_next_page) {
				countImage -= 1;
				let data = await this._pageMediaByUserName(page_info.end_cursor, idUser, countImage);
				return data;
			}
		}
		return this.mediaImage;
	}

	async getStory (username) {
		const dataUrl = [];
		let response = await this.getProfile(username);
		let { data } = await this.fetchApi(config.GRAPHQL_URL.storyByUserId(response.graphql.user.id), 'GET');
		if (data.reels_media.length > 0) {
			let { items } = data.reels_media[0];
			for (let i = 0; i < items.length; i++) {
				let resources = items[i].is_video ? 'video_resources' : 'display_resources';
				dataUrl.push({
					reelMediaId: items[i].id,
					latestReelMedia: data.reels_media[0].latest_reel_media,
					reelMediaOwnerId: items[i].owner.id,
					reelMediaTakenAt: items[i].taken_at_timestamp,
					media: items[i][resources][items[i][resources].length - 1].src,
				});
			}
			return dataUrl;
		}
	}

	async uploadPhoto (path, caption) {
		const uploadID = new Date().getTime();
		let result = await this.configurePhoto(path, uploadID);
		if (result.status === 'ok') {
			let configure = await this.fetchApi('create/configure/', 'POST', {
				upload_id: uploadID,
				caption: caption,
			});
			return configure;
		}
		return { success: false, message: 'something error' };
	}

	configurePhoto (path, uploadID) {
		let imageBuffer = fs.createReadStream(path);
		return this.fetchApi('create/upload/photo/', 'POST', {
			upload_id: uploadID,
			photo: {
				value: imageBuffer,
				options: {
					filename: `pending_media_${uploadID}.jpg`,
					contentType: 'image/jpeg',
				},
			},
			media_type: 1,
		}, 1);
	}

	async like (id) {
		let data = await this.fetchApi(config.GRAPHQL_URL.likeMedia(id), 'POST');
		return data;
	}

	async comment (id, code, comment) {
		let data = await this.fetchApi(config.GRAPHQL_URL.commentMedia(id), 'POST', { comment_text: comment });
		return data;
	}

	async getUserNotFollowBack (username) {
		let peopleNotFollowBack = [];
		let follower = await this.follower({ username });
		let following = await this.following({ username });

		let dataFollowing = following.data.map(v => {
			return v.username;
		});

		let dataFollower = follower.data.map(v => {
			return v.username;
		});

		dataFollowing.map(v => {
			if (!dataFollower.includes(v)) {
				peopleNotFollowBack.push(v);
			}
		});
		return peopleNotFollowBack;
	}
}

export default Api;