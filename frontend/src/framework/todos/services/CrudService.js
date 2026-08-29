import BaseService from "./BaseService";

export default class CrudService extends BaseService {

    list(params = {}) {

        return this.get("", {

            params

        });

    }

    getById(id) {

        return this.get(`/${id}`);

    }

    create(data) {

        return this.post("", data);

    }

    update(id, data) {

        return this.put(`/${id}`, data);

    }

    partialUpdate(id, data) {

        return this.patch(`/${id}`, data);

    }

    remove(id) {

        return this.delete(`/${id}`);

    }

}