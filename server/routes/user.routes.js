import express from 'express';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateUserSchema,
  favoritePropertySchema,
  userEditorSchema,
  updateVendorSchema,
  verifyVendorSchema,
  addCommentVendorSchema,
  verifyVendorInfoSchema,
  updateDirectorSchema,
  resolveCommentVendorSchema,
  unbanUserSchema,
  banUserSchema,
  updateRemittancePercentageSchema,
} from '../schemas/user.schema';
import {
  schemaValidation,
  authenticate,
  isAdmin,
  isUnverifiedVendor,
  hasValidObjectId,
} from '../helpers/middleware';
import UserController from '../controllers/user.controllers';
import Upload, { UploadController } from '../helpers/uploadImage';

const router = express.Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     tags:
 *       - User
 *     description: Creates a new user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Inventory item to add
 *     responses:
 *      '201':
 *        description: User created
 *      '400':
 *        description: Error adding user
 *      '412':
 *        description: Email is linked to another account
 *      '500':
 *       description: Internal server error
 */

router.post('/register', schemaValidation(registerSchema), UserController.register);

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     description: Authenticates user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                  type: string
 *                  example: john@mail.com
 *              password:
 *                  type: string
 *      description: Login Details
 *     responses:
 *      '200':
 *        description: Login Successful
 *      '401':
 *        description: Invalid email or password
 *      '500':
 *       description: Internal server error
 */

router.post('/login', schemaValidation(loginSchema), UserController.login);

/**
 * @swagger
 * path:
 *  /user/activate:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Activates a user account via token
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: Your account has been successfully activated
 *        '404':
 *          description: User not found
 *        '500':
 *          description: Internal server error
 */
router.get('/activate', UserController.activateToken);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     tags:
 *       - User
 *     description: Sends a reset password link to user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                  type: string
 *                  example: john@mail.com
 *      description: Generates Reset Password Link
 *     responses:
 *      '200':
 *        description: A password reset link has been sent to your email account
 *      '401':
 *        description: Your email address is not found. Please check and Try Again.
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/reset-password',
  schemaValidation(resetPasswordSchema),
  UserController.generateResetPasswordLink,
);

/**
 * @swagger
 * /user/change-password:
 *   post:
 *     tags:
 *       - User
 *     description: Changes a User Password
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *          type: string
 *         description: the auto generated user token via jwt
 *       - in: formData
 *         name: password
 *         schema:
 *          type: string
 *         description: the new password
 *       - in: formData
 *         name: confirmPassword
 *         schema:
 *          type: string
 *         description: confirm password
 *     summary: Changes a user password
 *     responses:
 *      '200':
 *        description: Your password has been successfully changed
 *      '404':
 *        description: User not found
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/change-password/:token',
  schemaValidation(changePasswordSchema),
  UserController.resetPasswordFromLink,
);

/**
 * @swagger
 * path:
 *  /user/who-am-i:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Activates a user account via token
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: Your account has been successfully activated
 *        '404':
 *          description: User not found
 *        '500':
 *          description: Internal server error
 */
router.get('/who-am-i', authenticate, UserController.currentUser);

/**
 * @swagger
 * /user/update:
 *   put:
 *     tags:
 *       - User
 *     description: Updates existing user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Updates existing user
 *     responses:
 *      '200':
 *        description: User updated
 *      '400':
 *        description: Error updating user
 *      '500':
 *       description: Internal server error
 */
router.put('/update', authenticate, schemaValidation(updateUserSchema), UserController.update);

/**
 * @swagger
 * /user/profile-image:
 *   post:
 *     tags:
 *       - User
 *     description: Uploads a new Profile Image for a user
 *     operationId: "uploadFile"
 *     consumes:
 *       - "multipart/form-data"
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: "image"
 *         in: "formData"
 *         type: "file"
 *     responses:
 *      '200':
 *        description: Image uploaded
 *      '400':
 *        description: Error uploading image
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/profile-image',
  authenticate,
  Upload.uploadProfileImage,
  UploadController.uploadProfileImage,
);

/**
 * @swagger
 * /user/upload-image:
 *   post:
 *     tags:
 *       - User
 *     description: Uploads a new image
 *     operationId: "uploadFile"
 *     consumes:
 *       - "multipart/form-data"
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: "image"
 *         in: "formData"
 *         type: "file"
 *     responses:
 *      '200':
 *        description: Image uploaded
 *      '400':
 *        description: Error uploading image
 *      '500':
 *       description: Internal server error
 */
router.post('/upload-image', authenticate, Upload.uploadImage, UploadController.uploadImage);

/**
 * @swagger
 * /user/upload:
 *   get:
 *     tags:
 *       - User
 *     description: gets AWS S3 signed URL
 *     produces:
 *       - application/json
 *     parameters:
 *        - in: query
 *          name: type
 *          schema:
 *            type: string
 *          description: type of the file to sign
 *        - in: query
 *          name: extension
 *          schema:
 *            type: string
 *          description: extension of the file to sign
 *     responses:
 *      '200':
 *        description: Signed URL generated
 *      '400':
 *        description: Error getting signed url
 *      '500':
 *       description: Internal server error
 */
router.get('/upload', authenticate, UploadController.uploadToS3);

/**
 * @swagger
 * /user/all:
 *   get:
 *     tags:
 *       - User
 *     description: Get all users in the db based on filters
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Get all users in the db based on filters
 *     responses:
 *      '200':
 *        description: returns object of users
 *      '500':
 *       description: Internal server error
 */
router.get('/all', authenticate, isAdmin, UserController.getAllUsers);

/**
 * @swagger
 * /user/add-to-favorites:
 *   post:
 *     tags:
 *       - User
 *     description: Add a property to a user favorites
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              propertyId:
 *                  type: string
 *      description: ID of property to be added to favorites
 *     responses:
 *      '200':
 *        description: Property added to favorites
 *      '404':
 *        description: Property not available
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/add-to-favorites',
  authenticate,
  schemaValidation(favoritePropertySchema),
  UserController.addPropertyToFavorites,
);

/**
 * @swagger
 * /user/remove-favorite:
 *   post:
 *     tags:
 *       - User
 *     description: Remove a property from favorites
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              propertyId:
 *                  type: string
 *      description: ID of property to be removed tofrom favorites
 *     responses:
 *      '200':
 *        description: Property removed from favorites
 *      '404':
 *        description: Property not available
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.post(
  '/remove-favorite',
  authenticate,
  schemaValidation(favoritePropertySchema),
  UserController.removePropertyFromFavorites,
);

/**
 * @swagger
 * path:
 *  /user/account-overview:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: the auto generated user token via jwt
 *      summary: Returns financial overview of user (contribution reward, referral bonus etc)
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: Returns overview
 *        '500':
 *          description: Internal server error
 */
router.get('/account-overview', authenticate, UserController.getAccountOverview);

/**
 * @swagger
 * /user/editor/upgrade:
 *   put:
 *     tags:
 *       - User
 *     description: Upgrade access of user to a content editor
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              userId:
 *                  type: string
 *      description: ID of user to be upgraded
 *     responses:
 *      '200':
 *        description: Upgrade access of user to a content editor
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/editor/upgrade',
  authenticate,
  isAdmin,
  schemaValidation(userEditorSchema),
  UserController.upgradeUserToEditor,
);

/**
 * @swagger
 * /user/editor/downgrade:
 *   put:
 *     tags:
 *       - User
 *     description: Downgrade access of user to a content editor
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              userId:
 *                  type: string
 *      description: ID of user to be downgraded
 *     responses:
 *      '200':
 *        description: Downgrade access of content editor to a user
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/editor/downgrade',
  authenticate,
  isAdmin,
  schemaValidation(userEditorSchema),
  UserController.downgradeEditorToUser,
);

/**
 * @swagger
 * /user/vendor/verify:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to verify a vendor
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Vendor verified
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/verify',
  authenticate,
  isAdmin,
  schemaValidation(verifyVendorSchema),
  UserController.verifyVendor,
);

/**
 * @swagger
 * /user/vendor/verify/step:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to verify a vendor's information
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *              step:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Information verified
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/verify/step',
  authenticate,
  isAdmin,
  schemaValidation(verifyVendorInfoSchema),
  UserController.verifyVendorStep,
);

/**
 * @swagger
 * /user/vendor/verify/comment:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to add comment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *              step:
 *                  type: string
 *              comment:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Comment added
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/verify/comment',
  authenticate,
  isAdmin,
  schemaValidation(addCommentVendorSchema),
  UserController.addCommentToVerificationStep,
);

/**
 * @swagger
 * /user/vendor/verify/comment/resolve:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to resolve a comment
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *              step:
 *                  type: string
 *              comment:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Comment resolved
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/verify/comment/resolve',
  authenticate,
  isAdmin,
  schemaValidation(resolveCommentVendorSchema),
  UserController.resolveVerificationStepComment,
);

/**
 * @swagger
 * /user/vendor/update:
 *   put:
 *     tags:
 *       - User
 *     description: Updates vendor information
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Updates vendor information
 *     responses:
 *      '200':
 *        description: Vendor Information updated
 *      '400':
 *        description: Error updating vendor
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/update',
  authenticate,
  isUnverifiedVendor,
  schemaValidation(updateVendorSchema),
  UserController.updateVendor,
);

/**
 * @swagger
 * /user/vendor/director:
 *   put:
 *     tags:
 *       - User
 *     description: Edit a director or signatory info
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Edit a director or signatory info
 *     responses:
 *      '200':
 *        description: Director updated
 *      '400':
 *        description: Error updating director
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/director',
  authenticate,
  isUnverifiedVendor,
  schemaValidation(updateDirectorSchema),
  UserController.editDirector,
);

/**
 * @swagger
 * /user/vendor/director/:id:
 *   delete:
 *     tags:
 *       - User
 *     description: Remove director or signatory from vendor profile
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *      description: Remove director or signatory from vendor profile
 *     responses:
 *      '200':
 *        description: Director removed
 *      '400':
 *        description: Error removing director
 *      '500':
 *       description: Internal server error
 */
router.delete(
  '/vendor/director/:id',
  hasValidObjectId,
  authenticate,
  isUnverifiedVendor,
  UserController.removeDirector,
);

/**
 * @swagger
 * /user/vendor/certify:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to certify a vendor
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *     responses:
 *      '200':
 *        description: Vendor certified
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/vendor/certify',
  authenticate,
  isAdmin,
  schemaValidation(verifyVendorSchema),
  UserController.certifyVendor,
);

/**
 * @swagger
 * /user/ban:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to ban a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              userId:
 *                  type: string
 *              reason:
 *                  type: string
 *     responses:
 *      '200':
 *        description: User banned
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put('/ban', authenticate, isAdmin, schemaValidation(banUserSchema), UserController.banUser);

/**
 * @swagger
 * /user/unban:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to unban a user
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              userId:
 *                  type: string
 *              reason:
 *                  type: string
 *     responses:
 *      '200':
 *        description: User unbanned
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/unban',
  authenticate,
  isAdmin,
  schemaValidation(unbanUserSchema),
  UserController.unbanUser,
);

/**
 * @swagger
 * path:
 *  /user/:id:
 *    get:
 *      parameters:
 *        - in: query
 *          name: token
 *          schema:
 *            type: string
 *          description: verifies user access
 *      summary: Gets a user based by its ID
 *      tags: [User]
 *      responses:
 *        '200':
 *          description: User found
 *        '500':
 *          description: Internal server error
 */
router.get('/:id', hasValidObjectId, authenticate, isAdmin, UserController.getOneUser);

/**
 * @swagger
 * /user/remittance-percentage:
 *   put:
 *     tags:
 *       - User
 *     description: Allows an admin to update the remittance percentage of a vendor
 *     produces:
 *       - application/json
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              vendorId:
 *                  type: string
 *              percentage:
 *                  type: integer
 *     responses:
 *      '200':
 *        description: Remittance percentage updated
 *      '404':
 *        description: User not found
 *      '400':
 *        description: Bad request
 *      '500':
 *       description: Internal server error
 */
router.put(
  '/remittance-percentage',
  authenticate,
  isAdmin,
  schemaValidation(updateRemittancePercentageSchema),
  UserController.updateRemittancePercentage,
);

module.exports = router;
